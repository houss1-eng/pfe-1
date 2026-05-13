import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './WireframeGenerator.css';

const WireframeGenerator = () => {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [elementCounter, setElementCounter] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDraggedElement(null);
      }
    };

    const handleGlobalMouseMove = (e) => {
      if (isDragging && draggedElement) {
        handleElementDrag(e, draggedElement);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, draggedElement]);

  const handleDragStart = (e, elementType, elementText) => {
    e.dataTransfer.setData('elementType', elementType);
    e.dataTransfer.setData('elementText', elementText);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('elementType');
    const elementText = e.dataTransfer.getData('elementText');
    
    if (!elementType) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    createWireframeElement(elementType, elementText, x, y);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const createWireframeElement = (type, text, x, y) => {
    const newElement = {
      id: `element-${elementCounter}`,
      type,
      text,
      x,
      y,
      width: type === 'button' ? 120 : type === 'input' ? 200 : 150,
      height: type === 'button' || type === 'input' ? 40 : 50,
      color: '#ffffff'
    };

    setElements(prev => [...prev, newElement]);
    setElementCounter(prev => prev + 1);
  };

  const handleElementMouseDown = (e, element) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
      return;
    }
    
    setIsDragging(true);
    setDraggedElement(element);
    setSelectedElement(element);
  };

  const handleElementDrag = (e, element) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - element.width / 2;
    const y = e.clientY - rect.top - element.height / 2;
    
    setElements(prev => prev.map(el => 
      el.id === element.id ? { ...el, x, y } : el
    ));
  };

  const handleElementClick = (element) => {
    setSelectedElement(element);
  };

  const updateSelectedElement = (property, value) => {
    if (!selectedElement) return;
    
    setElements(prev => prev.map(el => 
      el.id === selectedElement.id ? { ...el, [property]: value } : el
    ));
  };

  const clearCanvas = () => {
    setElements([]);
    setSelectedElement(null);
  };

  const saveWireframe = async () => {
    const name = prompt('Nom du wireframe:');
    if (!name) return;
    
    try {
      const response = await axios.post('http://localhost:5000/api/wireframes', {
        name,
        elements
      });
      
      if (response.data.success) {
        alert('Wireframe sauvegardé avec succès!');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du wireframe');
    }
  };

  const exportWireframe = () => {
    const wireframe = {
      elements,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(wireframe, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wireframe-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderElement = (element) => {
    const style = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      backgroundColor: element.color,
      border: selectedElement?.id === element.id ? '2px solid #7C3AED' : '2px solid #4F46E5',
      borderRadius: '4px',
      padding: '10px',
      cursor: 'move',
      zIndex: draggedElement?.id === element.id ? 1000 : 1
    };

    const content = (() => {
      switch (element.type) {
        case 'button':
          return (
            <button 
              style={{
                width: '100%',
                height: '100%',
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {element.text}
            </button>
          );
        case 'input':
          return (
            <input
              type="text"
              placeholder={element.text}
              style={{
                width: '100%',
                height: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          );
        case 'text':
          return <p style={{ margin: 0 }}>{element.text}</p>;
        case 'image':
          return (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#f0f0f0',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              Image
            </div>
          );
        case 'container':
          return (
            <div style={{
              width: '100%',
              height: '100%',
              background: '#f9f9f9',
              border: '1px dashed #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              Conteneur
            </div>
          );
        case 'nav':
          return (
            <nav style={{
              width: '100%',
              height: '100%',
              background: '#4F46E5',
              color: 'white',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              boxSizing: 'border-box'
            }}>
              <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Accueil</a>
              <a href="#" style={{ color: 'white', textDecoration: 'none' }}>À propos</a>
              <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Contact</a>
            </nav>
          );
        default:
          return <div>{element.text}</div>;
      }
    })();

    return (
      <div
        key={element.id}
        style={style}
        onMouseDown={(e) => handleElementMouseDown(e, element)}
        onClick={() => handleElementClick(element)}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="wireframe-generator">
      <div className="wireframe-header">
        <h1>Générateur de Wireframe</h1>
        <p>Créez des maquettes interactives pour vos projets</p>
      </div>

      <div className="wireframe-controls">
        <div className="control-panel">
          <h3>Éléments</h3>
          <div className="element-palette">
            <div 
              className="draggable-element" 
              draggable 
              onDragStart={(e) => handleDragStart(e, 'button', 'Bouton')}
            >
              Bouton
            </div>
            <div 
              className="draggable-element" 
              draggable 
              onDragStart={(e) => handleDragStart(e, 'input', 'Champ')}
            >
              Champ
            </div>
            <div 
              className="draggable-element" 
              draggable 
              onDragStart={(e) => handleDragStart(e, 'text', 'Texte')}
            >
              Texte
            </div>
            <div 
              className="draggable-element" 
              draggable 
              onDragStart={(e) => handleDragStart(e, 'image', 'Image')}
            >
              Image
            </div>
            <div 
              className="draggable-element" 
              draggable 
              onDragStart={(e) => handleDragStart(e, 'container', 'Conteneur')}
            >
              Conteneur
            </div>
            <div 
              className="draggable-element" 
              draggable 
              onDragStart={(e) => handleDragStart(e, 'nav', 'Navigation')}
            >
              Navigation
            </div>
          </div>
          <div className="control-actions">
            <button className="btn-wireframe" onClick={clearCanvas}>Effacer</button>
            <button className="btn-wireframe" onClick={saveWireframe}>Sauvegarder</button>
            <button className="btn-wireframe" onClick={exportWireframe}>Exporter</button>
          </div>
        </div>

        <div className="properties-panel">
          <h3>Propriétés</h3>
          {selectedElement ? (
            <div className="property-controls">
              <div className="property-group">
                <label className="property-label">Largeur</label>
                <input 
                  type="number" 
                  className="property-input" 
                  value={selectedElement.width}
                  onChange={(e) => updateSelectedElement('width', parseInt(e.target.value))}
                />
              </div>
              <div className="property-group">
                <label className="property-label">Hauteur</label>
                <input 
                  type="number" 
                  className="property-input" 
                  value={selectedElement.height}
                  onChange={(e) => updateSelectedElement('height', parseInt(e.target.value))}
                />
              </div>
              <div className="property-group">
                <label className="property-label">Texte</label>
                <input 
                  type="text" 
                  className="property-input" 
                  value={selectedElement.text}
                  onChange={(e) => updateSelectedElement('text', e.target.value)}
                />
              </div>
              <div className="property-group">
                <label className="property-label">Couleur</label>
                <input 
                  type="color" 
                  className="property-input" 
                  value={selectedElement.color}
                  onChange={(e) => updateSelectedElement('color', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <p style={{ color: '#999', fontStyle: 'italic' }}>Sélectionnez un élément pour modifier ses propriétés</p>
          )}
        </div>
      </div>

      <div 
        className="canvas-area" 
        ref={canvasRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {elements.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '200px' }}>
            Glissez-déposez des éléments ici pour commencer
          </p>
        ) : (
          elements.map(renderElement)
        )}
      </div>
    </div>
  );
};

export default WireframeGenerator;
