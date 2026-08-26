import { useState } from "react";
import "./App.css";
import { Button, Card, Input, Toggle, KPITile } from "@40labs/ui-components";

function App() {
  const [darkToggle, setDarkToggle] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="min-h-screen p-8 flex flex-col gap-6">
      <h1 className="font-heading text-2xl text-primary">
        40LabsCore — UI Components Test
      </h1>

      {/* KPI tiles */}
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        <KPITile label="Today's Sales" value="TZS 6,000" tone="primary" />
        <KPITile label="Low Stock" value={1} tone="accent" />
        <KPITile label="Expired" value={1} tone="danger" />
      </div>

      {/* Card */}
      <Card className="max-w-md">
        <p className="font-ui text-sm">
          This is a static display card — elevation-raised only, no hover.
        </p>
      </Card>

      <Card interactive className="max-w-md" onClick={() => alert("Card clicked")}>
        <p className="font-ui text-sm">
          This is an interactive card — hover over me to see elevation-hover.
        </p>
      </Card>

      {/* Input */}
      <div className="max-w-sm">
        <Input
          label="Search medicine"
          placeholder="Paracetamol..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button intent="primary">Primary</Button>
        <Button intent="secondary">Secondary</Button>
        <Button intent="danger">Danger</Button>
      </div>

      {/* Toggle */}
      <Toggle
        checked={darkToggle}
        onChange={setDarkToggle}
        label="Dark mode (test toggle, not wired yet)"
      />
    </div>
  );
}

export default App;
