const fs = require('fs');
let content = fs.readFileSync('procfin-react/src/components/SmeSourcing.jsx', 'utf8');

// The first script might not have hit the exact regex for province in the grid list (line 452).
// Let's replace the grid card location display specifically:
content = content.replace(
  /<p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">\s*<MapPin size=\{10\} className="text-gray-600 shrink-0" \/>\s*\{sup\.province \|\| 'South Africa'\}\s*<\/p>/g,
  `<p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                    <MapPin size={10} className="text-gray-600 shrink-0" />
                                    {[sup.suburb, sup.city, sup.province].filter(Boolean).join(', ') || 'South Africa'}
                                </p>`
);

// We should also display the truncated description in the grid card
content = content.replace(
  /<p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">\s*<MapPin size=\{10\} className="text-gray-600 shrink-0" \/>\s*\{\[sup\.suburb, sup\.city, sup\.province\]\.filter\(Boolean\)\.join\(\', \'\) \|\| \'South Africa\'\}\s*<\/p>/g,
  `<p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                    <MapPin size={10} className="text-gray-600 shrink-0" />
                                    {[sup.suburb, sup.city, sup.province].filter(Boolean).join(', ') || 'South Africa'}
                                </p>
                                {sup.description && (
                                    <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                                        {sup.description}
                                    </p>
                                )}`
);

fs.writeFileSync('procfin-react/src/components/SmeSourcing.jsx', content, 'utf8');
