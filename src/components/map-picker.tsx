// Admin map picker: search for a place or click on the map to drop a pin, then add the pin's
// Google Maps link to the form or copy it. Web only (the admin panel is used in the browser);
// on phones it offers to open Google Maps so a share link can be pasted instead.
import Ionicons from '@expo/vector-icons/Ionicons';
import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

export type PickedPlace = { lat: number; lng: number; address: string };

/** Google Maps link that drops a pin at these coordinates. */
export const pinLink = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;

/** Coordinates inside a Google Maps link (pin links, "@lat,lng" links), if any. */
export function coordsFromLink(url: string): { lat: number; lng: number } | null {
  const m = url.match(/query=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ?? url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

const MESSAGE_TYPE = 'northbridge-map-pick';

/** The page shown inside the iframe: a Leaflet map with OpenStreetMap tiles and search. */
function mapPage(start: { lat: number; lng: number } | null, query: string) {
  const config = JSON.stringify({ start, query, type: MESSAGE_TYPE });
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body{margin:0;height:100%;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  #bar{position:absolute;z-index:1000;top:10px;left:50px;right:10px;display:flex;gap:6px}
  #q{flex:1;min-width:0;padding:9px 10px;border:1px solid #c9d1dc;border-radius:6px;font-size:14px}
  #go{padding:9px 14px;border:0;border-radius:6px;background:#0B2545;color:#fff;font-weight:700;cursor:pointer}
  #hint{position:absolute;z-index:1000;bottom:10px;left:10px;right:10px;background:rgba(255,255,255,.95);padding:8px 10px;border-radius:6px;font-size:13px;color:#33475b}
  #map{position:absolute;inset:0}
</style></head>
<body>
<div id="map"></div>
<div id="bar"><input id="q" placeholder="Search a place or address"><button id="go">Search</button></div>
<div id="hint">Search, or click on the map to drop a pin.</div>
<script>
  var cfg = ${config};
  var map = L.map('map').setView(cfg.start ? [cfg.start.lat, cfg.start.lng] : [20, 0], cfg.start ? 16 : 2);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  var marker = null;
  var hint = document.getElementById('hint');
  function send(lat, lng, address) {
    parent.postMessage({ type: cfg.type, lat: lat, lng: lng, address: address || '' }, '*');
  }
  function pin(lat, lng, address) {
    if (marker) marker.setLatLng([lat, lng]); else marker = L.marker([lat, lng]).addTo(map);
    hint.textContent = address || (lat.toFixed(5) + ', ' + lng.toFixed(5));
    send(lat, lng, address);
  }
  function reverse(lat, lng) {
    pin(lat, lng, '');
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=' + lat + '&lon=' + lng)
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.display_name) pin(lat, lng, d.display_name); })
      .catch(function () {});
  }
  function search(text) {
    if (!text) return;
    hint.textContent = 'Searching…';
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(text))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.length) { hint.textContent = 'No place found. Try another search or click on the map.'; return; }
        var lat = Number(d[0].lat), lng = Number(d[0].lon);
        map.setView([lat, lng], 16);
        pin(lat, lng, d[0].display_name);
      })
      .catch(function () { hint.textContent = 'Search is unavailable right now. Click on the map instead.'; });
  }
  map.on('click', function (e) { reverse(e.latlng.lat, e.latlng.lng); });
  document.getElementById('go').onclick = function () { search(document.getElementById('q').value.trim()); };
  document.getElementById('q').onkeydown = function (e) { if (e.key === 'Enter') search(this.value.trim()); };
  if (cfg.start) { marker = L.marker([cfg.start.lat, cfg.start.lng]).addTo(map); hint.textContent = 'Current pin. Click elsewhere to move it.'; }
  else if (cfg.query) { document.getElementById('q').value = cfg.query; search(cfg.query); }
</script>
</body></html>`;
}

/**
 * Map picker panel. `initialLink` centres the map on an existing pin; otherwise `initialQuery`
 * (the address typed in the form) is searched. `onUse` receives the pin's link and address.
 */
export function MapPicker({
  initialLink,
  initialQuery,
  onUse,
  onClose,
}: {
  initialLink: string;
  initialQuery: string;
  onUse: (link: string, place: PickedPlace) => void;
  onClose: () => void;
}) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [picked, setPicked] = useState<PickedPlace | null>(null);
  const [copied, setCopied] = useState(false);

  // Built once per opening so typing in the form doesn't reload the map.
  const [start] = useState(() => coordsFromLink(initialLink));
  const [query] = useState(initialQuery);
  const page = useMemo(() => mapPage(start, query), [start, query]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const d = e.data as { type?: string; lat?: number; lng?: number; address?: string };
      if (d?.type !== MESSAGE_TYPE || typeof d.lat !== 'number' || typeof d.lng !== 'number') return;
      setPicked({ lat: d.lat, lng: d.lng, address: d.address ?? '' });
      setCopied(false);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={s.panel}>
        <Text style={s.note}>
          Picking on a map works in the admin panel on a computer. On a phone, open Google Maps, find the place, tap Share, copy the
          link and paste it into Map link.
        </Text>
        <View style={s.actions}>
          <Pressable style={s.secondary} onPress={() => Linking.openURL('https://www.google.com/maps')}>
            <Text style={s.secondaryText}>Open Google Maps</Text>
          </Pressable>
          <Pressable style={s.secondary} onPress={onClose}>
            <Text style={s.secondaryText}>Close</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const link = picked ? pinLink(picked.lat, picked.lng) : '';
  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      window.prompt('Copy this map link:', link);
    }
  };

  return (
    <View style={s.panel}>
      <View style={s.frameWrap}>
        {createElement('iframe', {
          ref: frame,
          srcDoc: page,
          title: 'Pick the office location on the map',
          style: { border: 0, width: '100%', height: '100%' },
          sandbox: 'allow-scripts',
        })}
      </View>
      <View style={s.result}>
        <Ionicons name="location" size={18} color={picked ? colors.accent : colors.textMuted} />
        <Text style={[s.note, { flex: 1 }]} numberOfLines={2}>
          {picked ? picked.address || `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}` : 'No pin yet: search above the map or click on it.'}
        </Text>
      </View>
      <View style={s.actions}>
        <Pressable disabled={!picked} onPress={() => picked && onUse(link, picked)} style={[s.primary, !picked && { opacity: 0.5 }]}>
          <Ionicons name="add" size={16} color={colors.onPrimary} />
          <Text style={s.primaryText}>Add to form</Text>
        </Pressable>
        <Pressable disabled={!picked} onPress={copy} style={[s.secondary, !picked && { opacity: 0.5 }]}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={colors.primary} />
          <Text style={s.secondaryText}>{copied ? 'Copied' : 'Copy link'}</Text>
        </Pressable>
        <Pressable onPress={onClose} style={s.secondary}>
          <Text style={s.secondaryText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, gap: spacing.sm },
  frameWrap: { height: 380, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: '#E8EEF6' },
  result: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  note: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  primaryText: { color: colors.onPrimary, fontWeight: '700' },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryText: { color: colors.primary, fontWeight: '700' },
});
