import React, { useCallback, useEffect, useRef, useState } from 'react';
import initWasm, { init_program as initChip8 } from "rust-wasm-chip8";
import logo from './logo.svg';
import './App.css';

const ROMS = [
  "BLINKY",
] as const;

type Rom = typeof ROMS[number];

const loadRom = async (rom: Rom) => {
  const res = await fetch(`${process.env.PUBLIC_URL}/roms/${rom}`);
  console.log(await res.text())
  const arrayBuffer = await fetch(`roms/${rom}`).then(r => {
    return r;
  }).then(i => i.arrayBuffer());
  return new Uint8Array(arrayBuffer);
}

interface RomSelectorProps {
  onChange: (data: Uint8Array) => void;
}

const RomSelector = ({onChange}: RomSelectorProps) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedRom, setSelectedRom] = React.useState<Rom | null>(null);
  const handleChange = useCallback(async (event: React.ChangeEvent<HTMLSelectElement>) => {
    setIsLoading(true);
    try {
      const rom = event.target.value as Rom;
      setSelectedRom(rom);
      loadRom(rom).then(onChange);
    } finally {
      setIsLoading(false);
    }
  }, [onChange, setIsLoading]);
  return (
    <select value={selectedRom || "default"} disabled={isLoading} onChange={handleChange}>
      <option disabled key={"default"} value={"default"}>Select a ROM</option>
      {ROMS.map((rom) => (
        <option key={rom} value={rom}>{rom}</option>
      ))}
    </select>
  );
}

const translateKeys = {
  49: 0x1, // 1
  50: 0x2, // 2
  51: 0x3, // 3
  52: 0xc, // 4
  81: 0x4, // Q
  87: 0x5, // W
  69: 0x6, // E
  82: 0xd, // R
  65: 0x7, // A
  83: 0x8, // S
  68: 0x9, // D
  70: 0xe, // F
  90: 0xa, // Z
  88: 0x0, // X
  67: 0xb, // C
  86: 0xf // V
} as const;

function App() {
  const [romData, setRomData] = useState<Uint8Array | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const clearCpuRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!romData) return;
    if (!canvas) return;
    clearCpuRef.current();
    clearCpuRef.current = initChip8(romData, canvas);
    console.log("romData", romData)
  }, [romData, canvas]);
  return (
    <div className="App">
      <div><RomSelector onChange={setRomData} /></div>
      <div><canvas width={640} height={320} ref={setCanvas} /></div>
    </div>
  );
}

export default App;
