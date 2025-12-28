import { useState } from "react";
import { Layout, Model, TabNode, IJsonModel, Actions, DockLocation } from "flexlayout-react";
import "flexlayout-react/style/light.css";
import "./App.css";

// Simple test layout with two tabs
const defaultLayout: IJsonModel = {
  global: {
    tabEnableClose: true,
    tabEnableDrag: true,
    tabSetEnableDrag: true,
    tabSetEnableDrop: true,
    tabSetEnableDivide: true,
    tabSetEnableTabStrip: true,
    tabSetEnableMaximize: true,
    borderEnableDrop: true,
    enableEdgeDock: true,
  },
  borders: [],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        weight: 50,
        enableDrop: true,
        enableDrag: true,
        enableDivide: true,
        children: [
          {
            type: "tab",
            name: "Tab 1",
            component: "panel",
            enableDrag: true,
          },
          {
            type: "tab",
            name: "Tab 2",
            component: "panel",
            enableDrag: true,
          },
        ],
      },
      {
        type: "tabset",
        weight: 50,
        enableDrop: true,
        enableDrag: true,
        enableDivide: true,
        children: [
          {
            type: "tab",
            name: "Tab 3",
            component: "panel",
            enableDrag: true,
          },
        ],
      },
    ],
  },
};

function App() {
  const [model] = useState<Model>(() => Model.fromJson(defaultLayout));
  const [counter, setCounter] = useState(0);

  const factory = (node: TabNode) => {
    const component = node.getComponent();
    const name = node.getName();

    if (component === "panel") {
      return (
        <div style={{ padding: 20, height: "100%", boxSizing: "border-box" }}>
          <h2>{name}</h2>
          <p>This is a draggable panel. Try dragging this tab to another location!</p>
          <p>Counter: {counter}</p>
          <button onClick={() => setCounter((c) => c + 1)}>Increment</button>
        </div>
      );
    }
      return <div>Unknown: {component}</div>;
  };

  const addTab = () => {
    const tabsetNode = model.getActiveTabset();
    if (tabsetNode) {
      model.doAction(
        Actions.addNode(
          {
            type: "tab",
            component: "panel",
            name: `New Tab ${Date.now()}`,
            enableDrag: true,
          },
          tabsetNode.getId(),
          DockLocation.CENTER,
          -1
        )
      );
    }
  };

  return (
    <div className="app-container">
      <div className="toolbar">
        <h1>FlexLayout Test (Tauri)</h1>
        <button onClick={addTab}>Add Tab</button>
      </div>
      <div className="layout-container">
        <Layout model={model} factory={factory} />
      </div>
    </div>
  );
}

export default App;
