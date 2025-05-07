import type { Edge, Node } from "@xyflow/react";

import dagre from "@dagrejs/dagre";
import { Background, ConnectionLineType, Panel, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react";
import { useCallback, useState } from "react";

import "@xyflow/react/dist/style.css";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 150;
const nodeHeight = 50;
const placeholderJson = `
{
  "nodes": [
    {
      "id": "node-1",
      "data": {
        "label": "Node 1"
      }
    },
    {
      "id": "node-2",
      "data": {
        "label": "Node 2"
      }
    }
  ],
  "edges": [
    {
      "source": "node-1",
      "target": "node-2"
    }
  ]
}
`;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [hasErrorJson, setHasErrorJson] = useState(false);

  const handleShowLayout = useCallback(
    (formEvent: React.FormEvent<HTMLFormElement>) => {
      formEvent.preventDefault();
      setHasErrorJson(false); // Reset error state on new submission
      const formData = new FormData(formEvent.currentTarget);
      const json = formData.get("json") as string;
      try {
        const { nodes, edges, Nodes, Edges } = JSON.parse(json);
        // TODO: Validate newNodesData and newEdgesData structure if necessary
        // For now, assuming they are in the correct format for React Flow

        const newNodesData = nodes || Nodes;
        const newEdgesData = edges || Edges;

        // Example: Basic validation for nodes and edges arrays
        if (!Array.isArray(newNodesData) || !Array.isArray(newEdgesData)) {
          throw new Error("Invalid JSON structure: nodes and edges must be arrays.");
        }

        // Further processing to ensure nodes and edges are compatible with React Flow types
        // This might involve mapping or transforming the parsed data
        const formattedNodes: Node[] = newNodesData.map((node) => ({
          id: node.id,
          position: { x: 0, y: 0 }, // Initial position, layout will adjust this
          data: { label: node.data?.label || node.id },
          // Add other necessary node properties
        }));

        const formattedEdges: Edge[] = newEdgesData.map((edge) => ({
          id: edge.id || `${edge.source}-${edge.target}`, // Ensure edges have IDs
          source: edge.source,
          target: edge.target,
          // Add other necessary edge properties
        }));

        const { nodes: layoutedNewNodes, edges: layoutedNewEdges } = getLayoutedElements(formattedNodes, formattedEdges);
        setNodes(layoutedNewNodes);
        setEdges(layoutedNewEdges);
      } catch (error) {
        console.error("Failed to parse JSON or layout elements:", error);
        setHasErrorJson(true);
      }
    },
    [setNodes, setEdges]
  );

  return (
    <div className="w-screen h-screen text-black">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        style={{ backgroundColor: "#F7F9FB" }}
      >
        <Panel position="top-left" className="h-[90%] max-w-96 grid grid-rows-[1fr_auto] gap-2">
          <form onSubmit={handleShowLayout} className="flex flex-col h-full gap-2">
            <textarea
              name="json"
              className={`p-2 w-96 rounded-md text-black bg-white shadow h-full border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                hasErrorJson ? "border-red-500 ring-red-500" : "border-gray-300"
              }`}
              defaultValue={placeholderJson}
              rows={10}
              style={{ resize: "none" }}
              onChange={() => hasErrorJson && setHasErrorJson(false)}
            />
            {hasErrorJson && <p className="text-red-500 text-sm">Invalid JSON format. Please check the structure and try again.</p>}
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 border border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors h-12"
            >
              Show Layout
            </button>
          </form>
        </Panel>
        <Background />
      </ReactFlow>
    </div>
  );
}

export default App;
