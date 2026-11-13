import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Download, 
  Image as ImageIcon, 
  Layers, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Sparkles,
  Camera,
  FolderOpen
} from 'lucide-react';
import JSZip from 'jszip';
import './App.css';

// Formata tamanho em bytes
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function App() {
  const [gallery, setGallery] = useState([]);
  const [selectedDateId, setSelectedDateId] = useState(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const [isZipping, setIsZipping] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carrega o manifesto de fotos gerado automaticamente pelo script
  useEffect(() => {
    fetch('./gallery.json')
      .then((res) => {
        if (!res.ok) throw new Error('Sem fotos catalogadas ainda');
        return res.json();
      })
      .then((data) => {
        setGallery(data);
        if (data.length > 0) {
          setSelectedDateId(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('gallery.json não encontrado ou vazio:', err);
        setGallery([]);
        setLoading(false);
      });
  }, []);

  const totalPhotosCount = useMemo(() => {
    return gallery.reduce((acc, curr) => acc + (curr.photos?.length || 0), 0);
  }, [gallery]);

  const currentEvent = useMemo(() => {
    if (!selectedDateId) return gallery[0] || null;
    return gallery.find((e) => e.id === selectedDateId) || null;
  }, [gallery, selectedDateId]);

  const currentPhotos = currentEvent?.photos || [];

  // Baixar foto individualmente
  const handleDownloadSingle = async (e, photo) => {
    e.stopPropagation();
    try {
      const response = await fetch(`./${photo.path}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar foto:', error);
      // Fallback direto
      window.open(`./${photo.path}`, '_blank');
    }
  };

  // Baixar todas as fotos da data selecionada em arquivo .zip
  const handleDownloadAllAsZip = async () => {
    if (!currentEvent || currentPhotos.length === 0 || isZipping) return;

    try {
      setIsZipping(true);
      const zip = new JSZip();
      const folderName = `FloripaRacing_${currentEvent.id}`;
      const imgFolder = zip.folder(folderName);

      const downloadPromises = currentPhotos.map(async (photo) => {
        try {
          const res = await fetch(`./${photo.path}`);
          const blob = await res.blob();
          imgFolder.file(photo.filename, blob);
        } catch (err) {
          console.error(`Falha ao carregar ${photo.filename} para zip`, err);
        }
      });

      await Promise.all(downloadPromises);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao gerar arquivo zip:', err);
      alert('Houve um erro ao compactar as fotos.');
    } finally {
      setIsZipping(false);
    }
  };

  // Lightbox handlers
  const openLightbox = (index) => setActiveLightboxIndex(index);
  const closeLightbox = () => setActiveLightboxIndex(null);

  const prevPhoto = (e) => {
    e?.stopPropagation();
    setActiveLightboxIndex((prev) => 
      prev > 0 ? prev - 1 : currentPhotos.length - 1
    );
  };

  const nextPhoto = (e) => {
    e?.stopPropagation();
    setActiveLightboxIndex((prev) => 
      prev < currentPhotos.length - 1 ? prev + 1 : 0
    );
  };

  // Atalhos de teclado no lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, currentPhotos.length]);

  return (
    <div className="app-layout">
      {/* Header com estilo moderno Floripa Racing */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-section">
            <a href="./" className="logo-link">
              <img src="./logo.svg" alt="Floripa Racing Logo" className="brand-logo" />
            </a>
            <div className="brand-meta">
              <span className="brand-title">Floripa Racing</span>
              <span className="brand-badge">
                <span className="brand-badge-dot"></span>
                Galeria Oficial de Fotos
              </span>
            </div>
          </div>

          <div className="header-stats">
            <div className="stat-pill">
              <Calendar size={15} color="#ff1e27" />
              <span>Datas: <strong>{gallery.length}</strong></span>
            </div>
            <div className="stat-pill">
              <ImageIcon size={15} color="#00f0ff" />
              <span>Total de Fotos: <strong>{totalPhotosCount}</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        <section className="hero-banner">
          <div className="hero-tag">
            <Sparkles size={14} />
            <span>ARQUIVO VISUAL</span>
          </div>
          <h1 className="hero-heading">Galeria por Eventos</h1>
          <p className="hero-subheading">
            Selecione uma data para visualizar os registros em alta definição e fazer download das imagens individuais ou em lote (.zip).
          </p>
        </section>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <p>Carregando galeria...</p>
          </div>
        ) : gallery.length === 0 ? (
          /* Estado Vazio com Instruções de Uso */
          <div className="empty-state">
            <Camera className="empty-icon" />
            <h2 className="empty-title">Nenhuma foto encontrada ainda</h2>
            <p className="empty-desc">
              Para adicionar fotos e criar novas datas automaticamente, basta criar uma pasta com a data dentro de <code>public/assets/</code> e fazer push para o repositório.
            </p>
            <div className="instruction-box">
              📁 public/assets/13_11_2026/foto1.jpg<br />
              📁 public/assets/13_11_2026/foto2.jpg<br />
              📁 public/assets/20_11_2026/corrida.jpg
            </div>
          </div>
        ) : (
          <>
            {/* Seletor de Datas */}
            <div className="controls-card">
              <div className="dates-label-row">
                <span className="dates-title">
                  <Calendar size={18} color="var(--primary-red)" />
                  Datas Disponíveis
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  {gallery.length} encontro(s) catalogado(s)
                </span>
              </div>

              <div className="dates-pills">
                {gallery.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedDateId(ev.id)}
                    className={`date-pill-btn ${currentEvent?.id === ev.id ? 'active' : ''}`}
                  >
                    <span>{ev.title}</span>
                    <span className="pill-count">{ev.count} fotos</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Barra do Evento Selecionado & Botão de Download do Pacote Completo */}
            {currentEvent && (
              <div className="event-bar">
                <div className="event-details">
                  <h2 className="event-title-badge">
                    <span>{currentEvent.title}</span>
                  </h2>
                  <span className="event-subtitle">
                    Mostrando {currentPhotos.length} {currentPhotos.length === 1 ? 'registro fotográfico' : 'registros fotográficos'}
                  </span>
                </div>

                <div className="action-buttons">
                  <button 
                    className="btn-zip-download"
                    onClick={handleDownloadAllAsZip}
                    disabled={isZipping || currentPhotos.length === 0}
                  >
                    <Download size={18} />
                    <span>{isZipping ? 'Compactando fotos...' : `Baixar Todas (${currentPhotos.length}) em .ZIP`}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Grid de Fotos */}
            <div className="photos-grid">
              {currentPhotos.map((photo, idx) => (
                <div 
                  key={photo.filename} 
                  className="photo-card"
                  onClick={() => openLightbox(idx)}
                >
                  <div className="photo-wrapper">
                    <img 
                      src={`./${photo.path}`} 
                      alt={photo.filename} 
                      className="photo-img" 
                      loading="lazy"
                    />
                    <div className="photo-overlay">
                      <div className="zoom-indicator">
                        <ImageIcon size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="photo-card-footer">
                    <div className="photo-meta">
                      <span className="photo-name" title={photo.filename}>{photo.filename}</span>
                      {photo.size > 0 && (
                        <span className="photo-size">{formatFileSize(photo.size)}</span>
                      )}
                    </div>
                    <button 
                      className="btn-icon-download"
                      title="Baixar imagem"
                      onClick={(e) => handleDownloadSingle(e, photo)}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Lightbox / Modal de Visualização Expandida */}
      {activeLightboxIndex !== null && currentPhotos[activeLightboxIndex] && (
        <div className="lightbox-backdrop" onClick={closeLightbox}>
          <div className="lightbox-header" onClick={(e) => e.stopPropagation()}>
            <span className="lightbox-title">
              {currentPhotos[activeLightboxIndex].filename} 
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '12px' }}>
                ({activeLightboxIndex + 1} de {currentPhotos.length})
              </span>
            </span>

            <div className="lightbox-actions">
              <button 
                className="lightbox-btn" 
                title="Baixar esta foto"
                onClick={(e) => handleDownloadSingle(e, currentPhotos[activeLightboxIndex])}
              >
                <Download size={18} />
              </button>
              <button 
                className="lightbox-btn" 
                title="Fechar"
                onClick={closeLightbox}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <button className="lightbox-nav-prev" onClick={prevPhoto} title="Foto Anterior">
            <ChevronLeft size={28} />
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={`./${currentPhotos[activeLightboxIndex].path}`} 
              alt={currentPhotos[activeLightboxIndex].filename}
              className="lightbox-image" 
            />
          </div>

          <button className="lightbox-nav-next" onClick={nextPhoto} title="Próxima Foto">
            <ChevronRight size={28} />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="https://github.com/Willianjesusdasilva/fr-ranking" target="_blank" rel="noreferrer">
              Floripa Racing Ranking <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </a>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Floripa Racing. Galeria de Fotos & Mídia Automotiva.
          </p>
        </div>
      </footer>
    </div>
  );
}
