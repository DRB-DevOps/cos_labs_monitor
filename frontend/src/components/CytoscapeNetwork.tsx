import React, { useRef, useEffect } from 'react';
import cytoscape, { ElementDefinition, StylesheetCSS, LayoutOptions } from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
cytoscape.use(coseBilkent);

interface CytoscapeNetworkProps {
  elements: ElementDefinition[];
  style?: React.CSSProperties;
  layout?: LayoutOptions;
  stylesheet?: StylesheetCSS[];
}

const CytoscapeNetwork: React.FC<CytoscapeNetworkProps> = ({ elements, style, layout, stylesheet }) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);
  const layoutRef = useRef<cytoscape.Layouts | null>(null);

  useEffect(() => {
    if (cyRef.current) {
      if (cyInstance.current) {
        if (layoutRef.current) {
          try {
            layoutRef.current.stop();
          } catch (e) {}
          layoutRef.current = null;
        }
        cyInstance.current.destroy();
      }
      cyInstance.current = cytoscape({
        container: cyRef.current,
        elements,
        style: stylesheet,
        layout: undefined, // layout은 아래에서 실행
      });
      // cose-bilkent 레이아웃 적용
      const layoutOptions = {
        ...(layout || {}),
        name: 'cose-bilkent',
        animate: false,
        idealEdgeLength: 300,
        nodeRepulsion: 10000,
        gravity: 1,
        randomize: true,
        randomSeed: Math.floor(Math.random() * 100000),
        gravityRangeCompound: 2.0,
        gravityCompound: 2.0,
        initialEnergyOnIncremental: 0.8,
      };
      layoutRef.current = cyInstance.current.layout(layoutOptions);
      layoutRef.current.run();
      cyInstance.current.fit();
    }
    return () => {
      if (layoutRef.current) {
        try {
          layoutRef.current.stop();
        } catch (e) {}
        layoutRef.current = null;
      }
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };
  }, [elements, layout, stylesheet]);

  return <div ref={cyRef} style={style || { width: '100%', height: 500 }} />;
};

export default CytoscapeNetwork; 