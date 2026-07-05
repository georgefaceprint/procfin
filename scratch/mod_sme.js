const fs = require('fs');

let content = fs.readFileSync('procfin-react/src/components/SmeSourcing.jsx', 'utf8');

// Replace standard MapPin renders with city/suburb/province
content = content.replace(
  /{sup\.province \|\| 'South Africa'}/g,
  "{[sup.suburb, sup.city, sup.province].filter(Boolean).join(', ') || 'South Africa'}"
);

// In the detailed view (around line 510), add the description under the location
content = content.replace(
  /<p className="text-xs text-gray-500 mt-1 flex items-center gap-3">\s*<span className="flex items-center gap-1"><MapPin size=\{10\} \/> \{\[sup\.suburb, sup\.city, sup\.province\]\.filter\(Boolean\)\.join\(\', \'\) \|\| \'South Africa\'\}<\/span>\s*\{sup\.rating && <span className="flex items-center gap-1 text-yellow-400"><Star size=\{10\} fill="currentColor" \/> \{sup\.rating\} \/ 5<\/span>\}\s*<\/p>/g,
  `<p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                                    <span className="flex items-center gap-1"><MapPin size={10} /> {[sup.suburb, sup.city, sup.province].filter(Boolean).join(', ') || 'South Africa'}</span>
                                    {sup.rating && <span className="flex items-center gap-1 text-yellow-400"><Star size={10} fill="currentColor" /> {sup.rating} / 5</span>}
                                </p>
                                {sup.description && (
                                    <p className="text-sm text-gray-400 mt-3 leading-relaxed max-w-3xl">
                                        {sup.description}
                                    </p>
                                )}`
);

fs.writeFileSync('procfin-react/src/components/SmeSourcing.jsx', content, 'utf8');
