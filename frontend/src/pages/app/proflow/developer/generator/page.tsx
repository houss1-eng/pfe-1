import { useRef, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  Tab, Tabs, Typography,
} from '@mui/material';
import { generateCodeFromImage } from '@/services/api';

type GeneratedResult = {
  html: string;
  css: string;
};

export default function Page() {
  const [tab, setTab] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState<'html' | 'css' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide.');
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleGenerate = async () => {
    if (!image) return;
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const data = await generateCodeFromImage(image);
      const html = data.html || '';
      const css = data.css || '';
      if (!html && !css) throw new Error('Aucun code retourné par le workflow.');
      setResult({ html, css });
    } catch (e: unknown) {
      const axiosErr = e as any;
      const msg = axiosErr?.response?.data?.message || axiosErr?.response?.data?.detail || (e as Error).message || 'Erreur lors de la génération.';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (type: 'html' | 'css') => {
    const text = type === 'html' ? result?.html : result?.css;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = (type: 'html' | 'css') => {
    const text = type === 'html' ? result?.html : result?.css;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPreviewDoc = () => {
    if (!result) return '';
    return `<!DOCTYPE html><html><head><style>${result.css}</style></head><body>${result.html}</body></html>`;
  };

  return (
    <Box className="flex flex-col gap-4">
      <Box>
        <Typography variant="h4" fontWeight={700}>Générateur de Code</Typography>
        <Typography variant="body2" color="text.secondary">
          Chargez une maquette / image → l'IA génère le code HTML/CSS via n8n
        </Typography>
      </Box>

      {/* Upload zone */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            1. Chargez une image
          </Typography>

          <Box
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: image ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: image ? 'primary.50' : 'grey.50',
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {preview ? (
              <Box>
                <img
                  src={preview}
                  alt="Aperçu"
                  style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {image?.name} — Cliquez pour changer
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h2" sx={{ mb: 1 }}>🖼️</Typography>
                <Typography variant="body1" fontWeight={600}>Glissez une image ici</Typography>
                <Typography variant="body2" color="text.secondary">ou cliquez pour parcourir</Typography>
                <Typography variant="caption" color="text.secondary">(PNG, JPG, WebP…)</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Generate button */}
      <Button
        variant="contained"
        size="large"
        disabled={!image || generating}
        onClick={handleGenerate}
        startIcon={generating ? <CircularProgress size={18} color="inherit" /> : undefined}
        sx={{ alignSelf: 'flex-start', px: 4 }}
      >
        {generating ? 'Génération en cours…' : '⚡ Générer le code HTML/CSS'}
      </Button>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      {/* Result */}
      {result && (
        <Card>
          <CardContent>
            <Box className="flex items-center justify-between" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>2. Code généré</Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setPreviewOpen(p => !p)}
              >
                {previewOpen ? 'Masquer la prévisualisation' : '👁 Prévisualiser'}
              </Button>
            </Box>

            {previewOpen && (
              <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <iframe
                  srcDoc={getPreviewDoc()}
                  title="Prévisualisation"
                  style={{ width: '100%', height: 400, border: 'none' }}
                />
              </Box>
            )}

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="HTML" />
              <Tab label="CSS" />
            </Tabs>

            {(['html', 'css'] as const).map((type, i) => (
              tab === i && (
                <Box key={type}>
                  <Box className="flex gap-2" sx={{ mb: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleCopy(type)}
                    >
                      {copied === type ? '✅ Copié !' : 'Copier'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleDownload(type)}
                    >
                      Télécharger .{type}
                    </Button>
                  </Box>
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: '#1e1e1e',
                      color: '#d4d4d4',
                      p: 2,
                      borderRadius: 2,
                      overflow: 'auto',
                      maxHeight: 420,
                      fontSize: '0.82rem',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {type === 'html' ? result.html : result.css}
                  </Box>
                </Box>
              )
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
