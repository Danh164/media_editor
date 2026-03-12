import { create } from "zustand";
import { Canvas, FabricObject } from "fabric";

type HistoryState = {
  objects: any[];
  backgroundColor: string | null;
};

interface EditorState {
  canvas: Canvas | null;
  setCanvas: (canvas: Canvas | null) => void;
  
  // Selection
  activeObject: FabricObject | null;
  setActiveObject: (obj: FabricObject | null) => void;
  
  // Layers
  layers: any[];
  setLayers: (layers: any[]) => void;
  
  // Undo/Redo
  history: HistoryState[];
  currentHistoryIndex: number;
  pushHistory: (state: HistoryState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Tools & Styling
  activeTool: string;
  setActiveTool: (tool: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),

  activeObject: null,
  setActiveObject: (obj) => set({ activeObject: obj }),

  layers: [],
  setLayers: (layers) => set({ layers }),

  history: [],
  currentHistoryIndex: -1,
  
  pushHistory: (state) => {
    const { history, currentHistoryIndex } = get();
    // If we branched off from past history, slice the future
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push(state);
    
    // Max 50 steps
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    set({ 
      history: newHistory, 
      currentHistoryIndex: newHistory.length - 1,
      canUndo: newHistory.length > 1,
      canRedo: false
    });
  },

  undo: () => {
    const { history, currentHistoryIndex, canvas } = get();
    if (currentHistoryIndex > 0 && canvas) {
      const newIndex = currentHistoryIndex - 1;
      const state = history[newIndex];
      
      // Load state to canvas
      canvas.loadFromJSON(state).then(() => {
        canvas.renderAll();
        set({ 
          currentHistoryIndex: newIndex,
          canUndo: newIndex > 0,
          canRedo: true
        });
      });
    }
  },

  redo: () => {
    const { history, currentHistoryIndex, canvas } = get();
    if (currentHistoryIndex < history.length - 1 && canvas) {
      const newIndex = currentHistoryIndex + 1;
      const state = history[newIndex];
      
      // Load state to canvas
      canvas.loadFromJSON(state).then(() => {
        canvas.renderAll();
        set({ 
          currentHistoryIndex: newIndex,
          canUndo: true,
          canRedo: newIndex < history.length - 1
        });
      });
    }
  },
  
  canUndo: false,
  canRedo: false,

  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),
  
  fillColor: "#6366f1",
  setFillColor: (color) => set({ fillColor: color }),
  
  strokeColor: "#000000",
  setStrokeColor: (color) => set({ strokeColor: color }),
  
  strokeWidth: 2,
  setStrokeWidth: (width) => set({ strokeWidth: width }),
}));
