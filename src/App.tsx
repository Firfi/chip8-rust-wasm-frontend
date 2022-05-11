import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CPU, init_program as initChip8 } from 'rust-wasm-chip8';
import './App.css';

const ROMS = [
  "BLINKY",
  "CONNECT4",
  "LANDING",
  "MAZE",
  "PONG",
  "SPACE",
  "TANK",
  "TETRIS",
  "TICTACTOE",
  "WALL",
] as const;

type Rom = typeof ROMS[number];

const loadRom = async (rom: Rom) => {
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

// circumvent the "move" semantic ("already moved" between await calls); we collect the key presses between cpu iterations
const initKbBuffer = () => {
  let buffer: [number, 'up' | 'down'][] = [];
  const makeCb = (kind: 'up' | 'down') => (e: KeyboardEvent) => {
    buffer.push([e.which || e.keyCode, kind]);
  }
  const keyDownCb = makeCb('down');
  const keyUpCb = makeCb('up');
  document.addEventListener('keydown', keyDownCb);
  document.addEventListener('keyup', keyUpCb);
  return {
    drop: () => {
      document.removeEventListener('keydown', keyDownCb);
      document.removeEventListener('keyup', keyUpCb);
      buffer = [];
    },
    flush: () => {
      const r = [...buffer];
      buffer = [];
      return r;
    }
  }
}

function App() {
  const [romData, setRomData] = useState<Uint8Array | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const cpuRef = useRef<CPU | null>(null);
  useEffect(() => {
    if (!romData) return;
    if (!canvas) return;
    let stop = false;
    cpuRef.current = initChip8(romData, canvas);
    let kbBuffer = initKbBuffer();
    const run = async () => {
      while (cpuRef.current && !cpuRef.current?.is_done()) {
        if (stop) {
          cpuRef.current?.stop();
          cpuRef.current = null;
          return;
        }
        const buffer = kbBuffer.flush();
        buffer.forEach(([code, kind]) => {
          cpuRef.current![kind === 'up' ? 'key_up' : 'key_down'](code);
        })
        cpuRef.current = await cpuRef.current!.run() || null;
      }
    };
    run();
    return () => {
      stop = true;
      kbBuffer.drop();
    }
  }, [romData, canvas]);
  return (
    <div className="App">
      <h1>Chip8 wasm on Rust</h1>
      <div><RomSelector onChange={setRomData} /></div>
      <div><canvas width={640} height={320} ref={setCanvas} /></div>
      <div>Controls: 1234qwerasdfzxcv and whatnot</div>
    </div>
  );
}

export default App;
