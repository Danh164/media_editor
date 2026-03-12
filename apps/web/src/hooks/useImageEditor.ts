"use client";

import { useEffect, useRef, useCallback } from "react";
import { Canvas, Rect, Circle, IText, FabricImage, Triangle, Polygon, PencilBrush } from "fabric";
import { useEditorStore } from "@/stores/editorStore";

export function useImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, canvas, setActiveObject, pushHistory, activeTool, strokeWidth, strokeColor, undo, redo } = useEditorStore();

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Initialize Fabric Canvas
    const fabricCanvas = new Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });

    setCanvas(fabricCanvas);

    // Save initial state
    pushHistory(fabricCanvas.toJSON() as any);

    // Event listeners for state sync
    const onSelectionCreated = (e: any) => setActiveObject(e.selected?.[0] || null);
    const onSelectionCleared = () => setActiveObject(null);
    const onObjectModified = () => pushHistory(fabricCanvas.toJSON() as any);
    const onObjectAdded = (e: any) => {
      // Avoid history push during undo/redo loading
      if (!e.target?.ignoreHistory) {
         pushHistory(fabricCanvas.toJSON() as any);
      }
    };

    fabricCanvas.on("selection:created", onSelectionCreated);
    fabricCanvas.on("selection:updated", onSelectionCreated);
    fabricCanvas.on("selection:cleared", onSelectionCleared);
    fabricCanvas.on("object:modified", onObjectModified);
    fabricCanvas.on("object:added", onObjectAdded);

    // Single click to replace slot image
    fabricCanvas.on("mouse:down", (options) => {
      const target = options.target;
      if (target && (target as any).isSlot) {
        // Prevent default selection behavior to focus on the upload
        fabricCanvas.discardActiveObject();
        
        // Trigger file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (f) => {
              const data = f.target?.result as string;
              fillSlot(data, target as Rect);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    });

    // Basic keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Delete/Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach((obj) => fabricCanvas.remove(obj));
          fabricCanvas.discardActiveObject();
          pushHistory(fabricCanvas.toJSON() as any);
        }
      }

      // 2. Undo/Redo Shortcuts
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if (!isMac && cmdKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      fabricCanvas.off("selection:created", onSelectionCreated);
      fabricCanvas.off("selection:updated", onSelectionCreated);
      fabricCanvas.off("selection:cleared", onSelectionCleared);
      fabricCanvas.off("object:modified", onObjectModified);
      fabricCanvas.off("object:added", onObjectAdded);
      window.removeEventListener("keydown", handleKeyDown);
      fabricCanvas.dispose();
      setCanvas(null);
    };
  }, [setCanvas, setActiveObject, pushHistory]);

  // Handle Tool changes (Drawing Mode)
  useEffect(() => {
    if (!canvas) return;
    
    if (activeTool === "draw") {
      canvas.isDrawingMode = true;
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    } else {
      canvas.isDrawingMode = false;
    }
  }, [canvas, activeTool, strokeColor, strokeWidth]);

  const addText = useCallback(() => {
    if (!canvas) return;
    const text = new IText("Hello World", {
      left: 100,
      top: 100,
      fontFamily: "Geist, sans-serif",
      fontSize: 48,
      fill: "#000000",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  }, [canvas]);

  const addRectangle = useCallback(() => {
    if (!canvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: "#6366f1",
      width: 150,
      height: 100,
      rx: 8,
      ry: 8,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  }, [canvas]);

  const addCircle = useCallback(() => {
    if (!canvas) return;
    const circle = new Circle({
      left: 100,
      top: 100,
      fill: "#ec4899",
      radius: 75,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  }, [canvas]);

  const addTriangle = useCallback(() => {
    if (!canvas) return;
    const triangle = new Triangle({
      left: 100,
      top: 100,
      fill: "#f59e0b",
      width: 150,
      height: 150,
    });
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    canvas.renderAll();
  }, [canvas]);

  const addStar = useCallback(() => {
    if (!canvas) return;
    const points = calculateStarPoints(5, 75, 30);
    const star = new Polygon(points, {
      left: 100,
      top: 100,
      fill: "#8b5cf6",
    });
    canvas.add(star);
    canvas.setActiveObject(star);
    canvas.renderAll();
  }, [canvas]);

  const clearCanvas = useCallback(() => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    pushHistory(canvas.toJSON() as any);
  }, [canvas, pushHistory]);

  const addImage = useCallback((url: string) => {
    if (!canvas) return;
    FabricImage.fromURL(url, { crossOrigin: "anonymous" }).then((img) => {
      // Scale down if image is too large
      const maxWidth = canvas.width! * 0.8;
      const maxHeight = canvas.height! * 0.8;
      
      if (img.width! > maxWidth || img.height! > maxHeight) {
        const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
        img.scale(scale);
      }
      
      // Center image
      img.set({
        left: (canvas.width! - img.getScaledWidth()) / 2,
        top: (canvas.height! - img.getScaledHeight()) / 2,
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    }).catch(err => {
      console.error("Failed to load image:", err);
    });
  }, [canvas]);

  const fillSlot = useCallback((url: string, slot: Rect) => {
    if (!canvas) return;
    FabricImage.fromURL(url, { crossOrigin: "anonymous" }).then((img) => {
      const slotId = (slot as any).slotId;
      
      // 1. Remove existing image in this slot
      const existingImages = canvas.getObjects().filter(obj => (obj as any).parentSlotId === slotId);
      existingImages.forEach(imgObj => canvas.remove(imgObj));

      // 2. Scale image to COVER the slot
      const slotW = slot.getScaledWidth();
      const slotH = slot.getScaledHeight();
      const scale = Math.max(slotW / img.width!, slotH / img.height!);
      
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: slot.left! + (slotW - img.width! * scale) / 2,
        top: slot.top! + (slotH - img.height! * scale) / 2,
        selectable: false, // Make slots images non-selectable directly
        evented: false, 
      });

      // 3. ClipPath
      const clipRect = new Rect({
        left: slot.left,
        top: slot.top,
        width: slotW,
        height: slotH,
        absolutePositioned: true
      });
      img.set({ clipPath: clipRect });

      // 4. Mark image as part of this slot
      (img as any).isSlotImage = true;
      (img as any).parentSlotId = slotId;

      canvas.add(img);
      canvas.sendObjectToBack(img); 
      
      // Make slot semi-transparent to see the image but still selectable
      slot.set({ fill: "transparent", stroke: "rgba(99, 102, 241, 0.5)" });
      
      canvas.renderAll();
      pushHistory(canvas.toJSON() as any);
    });
  }, [canvas, pushHistory]);

  // Tool events listener with up-to-date callbacks
  useEffect(() => {
    const onAddText = () => addText();
    const onAddRect = () => addRectangle();
    const onAddCircle = () => addCircle();
    const onAddTriangle = () => addTriangle();
    const onAddStar = () => addStar();
    const onAddImage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        addImage(customEvent.detail);
      }
    };
    const onFillSlot = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { data, slot } = customEvent.detail;
      if (data && slot) {
        fillSlot(data, slot);
      }
    };

    window.addEventListener("editor:addText", onAddText);
    window.addEventListener("editor:addRect", onAddRect);
    window.addEventListener("editor:addCircle", onAddCircle);
    window.addEventListener("editor:addTriangle", onAddTriangle);
    window.addEventListener("editor:addStar", onAddStar);
    window.addEventListener("editor:addImage", onAddImage);
    window.addEventListener("editor:fillSlot", onFillSlot);

    return () => {
      window.removeEventListener("editor:addText", onAddText);
      window.removeEventListener("editor:addRect", onAddRect);
      window.removeEventListener("editor:addCircle", onAddCircle);
      window.removeEventListener("editor:addTriangle", onAddTriangle);
      window.removeEventListener("editor:addStar", onAddStar);
      window.removeEventListener("editor:addImage", onAddImage);
      window.removeEventListener("editor:fillSlot", onFillSlot);
    };
  }, [addText, addRectangle, addCircle, addTriangle, addStar, addImage]);

  return {
    canvasRef,
    containerRef,
    addText,
    addRectangle,
    addCircle,
    addTriangle,
    addStar,
    clearCanvas,
  };
}

// Helpers
function calculateStarPoints(spikes: number, outerRadius: number, innerRadius: number) {
  let rot = Math.PI / 2 * 3;
  let x = 0;
  let y = 0;
  let step = Math.PI / spikes;
  const points = [];

  for (let i = 0; i < spikes; i++) {
    x = Math.cos(rot) * outerRadius;
    y = Math.sin(rot) * outerRadius;
    points.push({ x, y });
    rot += step;

    x = Math.cos(rot) * innerRadius;
    y = Math.sin(rot) * innerRadius;
    points.push({ x, y });
    rot += step;
  }
  return points;
}
