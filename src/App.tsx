import React, { useCallback, useEffect, useState } from 'react';
import { WasmProgram, init_program as initChip8 } from '@firfi/rust-wasm-chip8';
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
  const arrayBuffer = await fetch(`roms/${rom}`).then(i => i.arrayBuffer());
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

const initKeyboardListeners = (cpu: WasmProgram) => {
  const makeCb = (kind: 'up' | 'down') => (e: KeyboardEvent) => {
    cpu[kind === 'up' ? 'key_up' : 'key_down'](e.which || e.keyCode);
  }
  const keyDownCb = makeCb('down');
  const keyUpCb = makeCb('up');
  document.addEventListener('keydown', keyDownCb);
  document.addEventListener('keyup', keyUpCb);
  return () => {
    document.removeEventListener('keydown', keyDownCb);
    document.removeEventListener('keyup', keyUpCb);
  };
}

function GameRoom() {
  const [romData, setRomData] = useState<Uint8Array | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!romData) return;
    if (!canvas) return;
    const cpu = initChip8(romData, canvas);
    cpu.run();
    const deinitKbListeners = initKeyboardListeners(cpu);
    return () => {
      cpu.stop();
      cpu.free();
      deinitKbListeners();
    }
  }, [romData, canvas]);
  return <div>
    <div><RomSelector onChange={setRomData} /></div>
    <div><canvas width={640} height={320} ref={setCanvas} /></div>
  </div>
}

function App() {

  return (
    <div className="App">
      <h1>Chip8 wasm on Rust</h1>
      <div style={{display: "flex"}}>
        <GameRoom />
        <GameRoom />
        <GameRoom />
        <GameRoom />
        <GameRoom />
      </div>
      <div>Controls: 1234qwerasdfzxcv and whatnot</div>
    </div>
  );
}

export default App;
