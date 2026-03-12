"use client";

import { useEffect, useRef, useCallback } from "react";
import { Canvas, Rect, Circle, IText, FabricImage } from "fabric";
import { useEditorStore } from "@/stores/editorStore";

export function useImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCanvas, canvas, setActiveObject, pushHistory, activeTool, strokeWidth, strokeColor } = useEditorStore();

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

    // Basic keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach((obj) => fabricCanvas.remove(obj));
          fabricCanvas.discardActiveObject();
          pushHistory(fabricCanvas.toJSON() as any);
        }
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
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = strokeColor;
        canvas.freeDrawingBrush.width = strokeWidth;
      }
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

  // Tool events listener with up-to-date callbacks
  useEffect(() => {
    const onAddText = () => addText();
    const onAddRect = () => addRectangle();
    const onAddCircle = () => addCircle();
    const onAddImage = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        addImage(customEvent.detail);
      }
    };

    window.addEventListener("editor:addText", onAddText);
    window.addEventListener("editor:addRect", onAddRect);
    window.addEventListener("editor:addCircle", onAddCircle);
    window.addEventListener("editor:addImage", onAddImage);

    return () => {
      window.removeEventListener("editor:addText", onAddText);
      window.removeEventListener("editor:addRect", onAddRect);
      window.removeEventListener("editor:addCircle", onAddCircle);
      window.removeEventListener("editor:addImage", onAddImage);
    };
  }, [addText, addRectangle, addCircle, addImage]);

  return {
    canvasRef,
    containerRef,
    addText,
    addRectangle,
    addCircle,
    clearCanvas,
  };
}
