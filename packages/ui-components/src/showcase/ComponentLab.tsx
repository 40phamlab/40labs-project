import { Button, IconButton, Badge, Separator, Card, CardHeader, CardBody, CardFooter, Input, Textarea, Toggle, Checkbox, Select, Spinner, Skeleton, Panel } from '../index';

export function ComponentLab() {
  return (
    <div className="p-8 space-y-16 bg-surface min-h-screen text-text pb-32">
      <header className="border-b border-border/20 pb-4">
        <h1 className="text-3xl font-heading font-bold text-primary">40Labs Component Lab</h1>
        <p className="text-text-muted mt-1">Core Primitive Rebuild & Validation (Phase 1)</p>
      </header>

      {/* BUTTONS */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-heading font-bold text-primary">1. Buttons & IconButtons</h2>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Interactive Primitives</span>
        </div>

        <div className="grid gap-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Intents & States</h3>
            <div className="flex flex-wrap gap-4 items-center bg-panel-strong/20 p-6 rounded-card border border-border/10">
              <Button intent="primary">Primary</Button>
              <Button intent="secondary">Secondary</Button>
              <Button intent="neutral">Neutral</Button>
              <Button intent="danger">Danger</Button>
              <Button intent="ghost">Ghost</Button>
              <div className="w-[1px] h-8 bg-border/20 mx-2" />
              <Button intent="primary" disabled>Disabled</Button>
              <Button intent="primary" loading>Loading State</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Sizes</h3>
              <div className="flex flex-wrap gap-4 items-end bg-panel-strong/20 p-6 rounded-card border border-border/10">
                <Button size="sm">Small (sm)</Button>
                <Button size="md">Medium (md)</Button>
                <Button size="lg">Large (lg)</Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Icon Buttons</h3>
              <div className="flex flex-wrap gap-4 items-center bg-panel-strong/20 p-6 rounded-card border border-border/10">
                <IconButton icon={<span>×</span>} label="Close" intent="danger" size="sm" />
                <IconButton icon={<span>+</span>} label="Add" intent="primary" />
                <IconButton icon={<span>⚙</span>} label="Settings" intent="neutral" size="lg" />
                <IconButton icon={<span>⎙</span>} label="Print" intent="ghost" />
                <IconButton icon={<span>↻</span>} label="Syncing" intent="primary" loading />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Edge Cases (Text Length)</h3>
            <div className="flex flex-col gap-4 bg-panel-strong/20 p-6 rounded-card border border-border/10">
              <div className="flex gap-4">
                <Button className="w-48">Short</Button>
                <Button className="w-48" loading>Short</Button>
              </div>
              <div className="flex gap-4">
                <Button className="flex-1 max-w-md text-nowrap">This is a very long button text to test dimension preservation during loading</Button>
                <Button className="flex-1 max-w-md text-nowrap" loading>This is a very long button text to test dimension preservation during loading</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORMS */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-heading font-bold text-primary">2. Form Controls</h2>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Inputs & Data Entry</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-panel-strong/20 p-8 rounded-card border border-border/10">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-text-muted mb-4 border-b border-border/10 pb-2">Inputs</h3>
            <Input label="Default Input" placeholder="Type something..." />
            <Input label="Input with Hint" hint="This is a helper text for the user" />
            <Input label="Required Input" required placeholder="This field is mandatory" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Error State" error="Invalid input value" defaultValue="Bad data" />
              <Input label="Success State" success defaultValue="Perfect data" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Disabled" disabled value="Cannot interact" />
              <Input label="Readonly" readOnly value="View only" />
            </div>
            <Input label="Monospace (SKU/Code)" monospace defaultValue="SKU-8829-XL" />
            <Input label="With Suffix" suffix={<span className="text-[10px] font-mono opacity-60">KG</span>} defaultValue="120" />
            <Input label="With Prefix" prefix={<span>🔍</span>} placeholder="Search records..." />
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-text-muted mb-4 border-b border-border/10 pb-2">Textarea & Select</h3>
              <Textarea label="Notes / Comments" placeholder="Write a novel here..." />
              <Select label="Status Select">
                <option>Active</option>
                <option>Inactive</option>
                <option>Archived</option>
              </Select>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-bold text-text-muted mb-4 border-b border-border/10 pb-2">Toggles & Checks</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Toggle checked={true} onChange={() => {}} label="Enabled Toggle" />
                  <Toggle checked={false} onChange={() => {}} label="Disabled Toggle" />
                  <Toggle checked={true} onChange={() => {}} label="Locked Toggle" disabled />
                </div>
                <div className="space-y-4">
                  <Checkbox label="Check Item A" checked={true} readOnly />
                  <Checkbox label="Check Item B" checked={false} readOnly />
                  <Checkbox label="Locked Check" disabled checked={true} readOnly />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DATA DISPLAY & LAYOUT */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-heading font-bold text-primary">3. Layout & Data Display</h2>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Cards, Panels & Feedback</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* CARDS */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Card Composition</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>Standard Card</CardHeader>
                <CardBody>
                  <p className="text-sm text-text-muted">Cards are used to group related information. They support headers and footers.</p>
                </CardBody>
                <CardFooter className="flex justify-end">
                  <Button size="sm" intent="neutral">Action</Button>
                </CardFooter>
              </Card>

              <Card interactive>
                <CardHeader>Interactive Card</CardHeader>
                <CardBody>
                  <p className="text-sm text-text-muted">This card has hover effects and a pointer cursor, suitable for clickable items.</p>
                </CardBody>
                <CardFooter>
                  <Badge variant="primary">New Feature</Badge>
                </CardFooter>
              </Card>
            </div>

            <Card>
              <CardBody noPadding className="h-32 flex items-center justify-center bg-panel-strong/10 border-2 border-dashed border-border/20 rounded-card">
                <span className="text-xs text-text-muted italic">Card Body with noPadding=true</span>
              </CardBody>
            </Card>
          </div>

          {/* PANELS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Panels (Layers)</h3>
            <div className="space-y-4 flex flex-col h-full">
              <Panel variant="flat" className="p-4 flex-1 flex items-center justify-center border border-border/5">Flat Layer</Panel>
              <Panel variant="raised" className="p-4 flex-1 flex items-center justify-center">Raised Layer</Panel>
              <Panel variant="inset" className="p-4 flex-1 flex items-center justify-center">Inset Layer</Panel>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* BADGES & SEPARATORS */}
          <div className="bg-panel-strong/20 p-6 rounded-card border border-border/10 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Semantic Badges</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">Neutral</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Separators</h3>
              <div className="space-y-4">
                <p className="text-xs text-text-muted">Horizontal:</p>
                <Separator />
                <div className="flex items-center gap-4 h-8 text-xs text-text-muted">
                  <span>Item 1</span>
                  <Separator orientation="vertical" />
                  <span>Item 2</span>
                  <Separator orientation="vertical" />
                  <span>Item 3</span>
                </div>
              </div>
            </div>
          </div>

          {/* FEEDBACK */}
          <div className="bg-panel-strong/20 p-6 rounded-card border border-border/10 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Spinners</h3>
              <div className="flex items-center gap-6">
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" className="text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-text-muted tracking-wider">Skeletons</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circle" className="w-8 h-8" />
                  <Skeleton variant="text" className="w-32" />
                </div>
                <Skeleton variant="rect" className="h-16 w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DENSE USAGE TEST */}
      <section className="space-y-6">
        <h2 className="text-xl font-heading font-bold text-primary">4. Stress Test: Dense Usage</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} className="bg-panel p-2 rounded-input border border-border/10 text-[9px] font-mono flex items-center justify-center aspect-square elevation-raised">
              #{i+1}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
