const fs = require('fs');

function processFile(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');

  // Add import if not exists
  if (!code.includes('useAlert')) {
    code = code.replace(
      /import React[^;]+;/,
      '$&\nimport { useAlert } from \'../../AlertProvider\';'
    );
  }

  // Add hook call inside component
  // Usually component is default export function ...
  if (!code.includes('const { showAlert, showConfirm } = useAlert();')) {
      code = code.replace(
        /(export default function [a-zA-Z0-9]+\([^)]*\)\s*\{)/,
        '$1\n  const { showAlert, showConfirm } = useAlert();'
      );
  }

  // Replace alert -> showAlert
  code = code.replace(/alert\(([^)]+)\);/g, (match, p1) => {
    let type = 'info';
    if (p1.toLowerCase().includes('berhasil') || p1.toLowerCase().includes('sukses')) type = 'success';
    else if (p1.toLowerCase().includes('gagal') || p1.toLowerCase().includes('error') || p1.toLowerCase().includes('tidak ada')) type = 'error';
    return `showAlert(${p1}, '${type}');`;
  });

  // Replace window.confirm & confirm
  code = code.replace(/const (handle[a-zA-Z0-9_]+) = \([^)]*\) => {([\s\S]*?)if \(!(?:window\.)?confirm\(([^)]+)\)\) return;/g, 'const $1 = async () => {$2const confirmed = await showConfirm($3);\n    if (!confirmed) return;');
  
  code = code.replace(/onClick=\{\(\) => \{([\s\S]*?)if \(!(?:window\.)?confirm\(([^)]+)\)\) return;/g, 'onClick={async () => {$1const confirmed = await showConfirm($2);\n    if (!confirmed) return;');

  // Remove toast globalNotifications if present (like in ManajemenAkun, DataAnggota)
  code = code.replace(/const \[globalNotification, setGlobalNotification\] = useState<[^>]+>\(null\);\s*/g, '');
  code = code.replace(/setGlobalNotification\([^)]+\);?/g, '');
  code = code.replace(/setTimeout\(\(\) => setGlobalNotification\(null\), 5000\);?/g, '');
  code = code.replace(/setTimeout\(\(\) => \{\s*setGlobalNotification\(null\);\s*\}, 5000\);?/g, '');
  code = code.replace(/\{\/\* GLOBAL TOAST NOTIFICATION \*\/\}[\s\S]*?\, document\.body\)\}/g, '');

  fs.writeFileSync(path, code);
}

// Special fixes for DataAnggota
function processDataAnggota() {
    const path = 'c:/src/PAC_KAWUNGANTEN/src/components/view/DataAnggota.tsx';
    if (!fs.existsSync(path)) return;
    processFile(path);
    let code = fs.readFileSync(path, 'utf8');

    // Replace some setFormSuccess that should also show alert for success
    code = code.replace(/setFormSuccess\('Data & Foto berhasil disimpan!'\);/g, "setFormSuccess('Data & Foto berhasil disimpan!');\n                showAlert('Data & Foto berhasil disimpan!', 'success');");
    code = code.replace(/setFormSuccess\('Data disimpan, namun sebagian foto gagal diunggah.'\);/g, "setFormSuccess('Data disimpan, namun sebagian foto gagal diunggah.');\n                showAlert('Data disimpan, namun sebagian foto gagal diunggah.', 'warning');");
    code = code.replace(/setFormSuccess\(editId \? 'Data anggota berhasil diperbarui!' : 'Anggota berhasil ditambahkan!'\);/g, "setFormSuccess(editId ? 'Data anggota berhasil diperbarui!' : 'Anggota berhasil ditambahkan!');\n            showAlert(editId ? 'Data anggota berhasil diperbarui!' : 'Anggota berhasil ditambahkan!', 'success');");
    
    // Add import if missing since DataAnggota didn't match `import React[^;]+;` maybe
    if (!code.includes('import { useAlert }')) {
        code = code.replace(
          /import \{ useQuery, useMutation, useQueryClient \} from '@tanstack\/react-query';/,
          "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\nimport { useAlert } from '../../AlertProvider';"
        );
    }
    
    if (!code.includes('const { showAlert, showConfirm } = useAlert();')) {
        code = code.replace(
          /const queryClient = useQueryClient\(\);/,
          "const queryClient = useQueryClient();\n  const { showAlert, showConfirm } = useAlert();"
        );
    }
    
    fs.writeFileSync(path, code);
}

processDataAnggota();
processFile('c:/src/PAC_KAWUNGANTEN/src/components/view/ManajemenAkun.tsx');
processFile('c:/src/PAC_KAWUNGANTEN/src/components/view/Laporan.tsx');
processFile('c:/src/PAC_KAWUNGANTEN/src/components/view/KasOrganisasi.tsx');

console.log("Done");
