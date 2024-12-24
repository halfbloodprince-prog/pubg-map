"use client";
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const maps = {
    Erangel: { src: '/Erangel_Main_High_Res.png', size: 8000 },
    Miramar: { src: '/Miramar_Main_High_Res.png', size: 8000 },
    Sanhok: { src: '/Sanhok_Main_High_Res.png', size: 4000 },
    Vikendi: { src: '/Vikendi_Main_High_Res.png', size: 8000 },
    Taego: { src: '/Taego_Main_High_Res.png', size: 8000 },
    Rondo: { src: '/Rondo_Main_High_Res.png', size: 8000 },
    Deston: { src: '/Deston_Main_High_Res.png', size: 8000 },
    Paramo: { src: '/Paramo_Main_High_Res.png', size: 3000 },
};

export default function Home() {
    const [selectedMap, setSelectedMap] = useState(null);
    const [startPoint, setStartPoint] = useState(null);
    const [mousePosition, setMousePosition] = useState(null);
    const [distance, setDistance] = useState(0);
    const [saveMode, setSaveMode] = useState(true);
    const [lineFixed, setLineFixed] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const mapRef = useRef(null);
    const audioRef = useRef(null);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        audioRef.current = new Audio('/oreshnik.ogg');
    }, []);

    const handleClick = (e) => {
        const map = mapRef.current;
        if (!map) return;

        const rect = mapRef.current.getBoundingClientRect();
        const baseSize = 8192;  // Базовое разрешение всех карт

// Рассчитываем масштабирование для обеих осей
        const scaleX = maps[selectedMap].size / rect.width;
        const scaleY = maps[selectedMap].size / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;



        if (startPoint && saveMode && !lineFixed) {
            setMousePosition({ x, y });
            setDistance(calculateDistance(startPoint, { x, y }));
            setLineFixed(true);
            if (audioRef.current && soundEnabled) {
                audioRef.current.play();
            }
        } else if (lineFixed) {
            setStartPoint(null);
            setMousePosition(null);
            setLineFixed(false);
        } else {
            setStartPoint({ x, y });
            setMousePosition({ x, y });
            setLineFixed(false);
        }
    };

    const handleMouseMove = (e) => {
        if (!startPoint || lineFixed) return;
        const map = mapRef.current;
        if (!map) return;

        const rect = map.getBoundingClientRect();
        const scaleX = maps[selectedMap].size / rect.width;
        const scaleY = maps[selectedMap].size / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setMousePosition({ x, y });
        setDistance(calculateDistance(startPoint, { x, y }));
    };

    const calculateDistance = (p1, p2) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    const handleMapSelect = (map) => {
        setSelectedMap(map);
        setStartPoint(null);
        setMousePosition(null);
        setDistance(0);
        setPanOffset({ x: 0, y: 0 });
    };

    return (
        <div className="container" style={{ height: '100vh' }} onMouseMove={handleMouseMove}>
            {selectedMap ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1>Измерение расстояния на карте</h1>
                        <div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={saveMode}
                                    onChange={() => setSaveMode(!saveMode)}
                                />
                                Сохранение разметки
                            </label>
                            <label style={{ marginLeft: '20px' }}>
                                <input
                                    type="checkbox"
                                    checked={soundEnabled}
                                    onChange={() => setSoundEnabled(!soundEnabled)}
                                />
                                Включить звук
                            </label>
                        </div>
                        <button onClick={() => setSelectedMap(null)} style={{ padding: '10px', fontSize: '16px' }}>
                            Вернуться в меню
                        </button>
                    </div>
                    <div
                        ref={mapRef}
                        onClick={handleClick}
                        onWheel={(e) => {
                            if (e.altKey || e.metaKey) {
                                e.preventDefault();
                                const rect = mapRef.current.getBoundingClientRect();
                                const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1;

                                const mouseX = e.clientX - rect.left;
                                const mouseY = e.clientY - rect.top;

                                const offsetX = (mouseX - rect.width / 2);
                                const offsetY = (mouseY - rect.height / 2);

                                const currentTransform = mapRef.current.style.transform.match(/scale\((.*?)\)/);
                                const currentScale = currentTransform ? parseFloat(currentTransform[1]) : 1;
                                const newScale = currentScale * scaleAmount;

                                const scaledX = panOffset.x - offsetX * (scaleAmount - 1);
                                const scaledY = panOffset.y - offsetY * (scaleAmount - 1);

                                mapRef.current.style.transform = `translate(${scaledX}px, ${scaledY}px) scale(${newScale})`;
                                setPanOffset({ x: scaledX, y: scaledY });
                                mapRef.current.dataset.scale = newScale;
                            }
                        }}
                        style={{
                            position: 'relative',
                            width: '100vw',
                            height: '100vh',
                            cursor: 'crosshair',
                            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${mapRef.current ? mapRef.current.dataset.scale || 1 : 1})`,
                        }}
                    >
                        <Image
                            src={maps[selectedMap].src}
                            alt="Map"
                            width={1920}
                            height={1080}
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                        />
                        {startPoint && mousePosition && (
                            <svg
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                            >
                                <line
                                    x1={`${(startPoint.x / maps[selectedMap].size) * 100}%`}
                                    y1={`${(startPoint.y / maps[selectedMap].size) * 100}%`}
                                    x2={`${(mousePosition.x / maps[selectedMap].size) * 100}%`}
                                    y2={`${(mousePosition.y / maps[selectedMap].size) * 100}%`}
                                    stroke="red"
                                    strokeDasharray="5,5"
                                />
                                <text
                                    x={`${(mousePosition.x / maps[selectedMap].size) * 100}%`}
                                    y={`${(mousePosition.y / maps[selectedMap].size) * 100 - 1}%`}
                                    fill="white"
                                    textAnchor="middle"
                                    style={{ fontSize: '12px', textShadow: '1px 1px 4px black' }}
                                >
                                    {distance.toFixed(2)} м
                                </text>
                            </svg>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h1>Выберите карту</h1>
                    {Object.keys(maps).map((map) => (
                        <button
                            key={map}
                            onClick={() => handleMapSelect(map)}
                            style={{ padding: '20px', fontSize: '18px', margin: '10px' }}
                        >
                            {map}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
