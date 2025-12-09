import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { Brain, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

interface GraphNode {
  id: string
  label: string
  type: string
  size: number
  color: string
  position: [number, number, number]
  connections: string[]
}

interface GraphLink {
  source: string
  target: string
  strength: number
}

// Node component
function Node({ node, onClick, isSelected }: { node: GraphNode; onClick: () => void; isSelected: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = node.position[1] + Math.sin(state.clock.elapsedTime + node.position[0]) * 0.1
      // Pulse when selected
      if (isSelected) {
        meshRef.current.scale.setScalar(node.size * (1 + Math.sin(state.clock.elapsedTime * 3) * 0.1))
      }
    }
  })

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[node.size, 32, 32]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0.1}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <Text
        position={[0, node.size + 0.3, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {node.label}
      </Text>
    </group>
  )
}

// Link component
function Link({ start, end, strength }: { start: [number, number, number]; end: [number, number, number]; strength: number }) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end])

  return (
    <Line
      points={points}
      color="#4a5568"
      lineWidth={strength * 2}
      opacity={0.4}
      transparent
    />
  )
}

// Main 3D Scene
function Scene({ nodes, links, selectedNode, setSelectedNode }: {
  nodes: GraphNode[]
  links: GraphLink[]
  selectedNode: string | null
  setSelectedNode: (id: string | null) => void
}) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>()
    nodes.forEach(n => map.set(n.id, n))
    return map
  }, [nodes])

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />

      {/* Links */}
      {links.map((link, i) => {
        const source = nodeMap.get(link.source)
        const target = nodeMap.get(link.target)
        if (!source || !target) return null
        return (
          <Link
            key={i}
            start={source.position}
            end={target.position}
            strength={link.strength}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map(node => (
        <Node
          key={node.id}
          node={node}
          onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
          isSelected={selectedNode === node.id}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={5}
        maxDistance={50}
      />
    </>
  )
}

// Color mapping for node types
const typeColors: Record<string, string> = {
  account: '#10b981',
  category: '#8b5cf6',
  service: '#3b82f6',
  social: '#ec4899',
  ai: '#f59e0b',
  finance: '#22c55e',
  email: '#06b6d4',
  development: '#6366f1',
}

export default function KnowledgeGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ nodes: 0, links: 0, categories: 0 })

  useEffect(() => {
    loadGraphData()
  }, [])

  const loadGraphData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/knowledge-graph')
      if (response.ok) {
        const data = await response.json()
        setNodes(data.nodes)
        setLinks(data.links)
        setStats(data.stats)
      } else {
        // Generate mock data from accounts
        generateMockGraph()
      }
    } catch {
      generateMockGraph()
    }
    setLoading(false)
  }

  const generateMockGraph = async () => {
    try {
      const accountsRes = await fetch('/api/accounts')
      const accounts = await accountsRes.json()

      const categoryMap = new Map<string, GraphNode>()
      const generatedNodes: GraphNode[] = []
      const generatedLinks: GraphLink[] = []

      // Create category nodes
      const categories = [...new Set(accounts.map((a: any) => a.category))]
      categories.forEach((cat, i) => {
        const angle = (i / categories.length) * Math.PI * 2
        const radius = 8
        const node: GraphNode = {
          id: `cat-${cat}`,
          label: cat as string,
          type: 'category',
          size: 0.8,
          color: typeColors.category,
          position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
          connections: []
        }
        categoryMap.set(cat as string, node)
        generatedNodes.push(node)
      })

      // Create account nodes
      accounts.forEach((account: any, i: number) => {
        const catNode = categoryMap.get(account.category)
        if (!catNode) return

        const baseAngle = Math.atan2(catNode.position[2], catNode.position[0])
        const spreadAngle = (Math.random() - 0.5) * 1.5
        const distance = 3 + Math.random() * 2
        const height = (Math.random() - 0.5) * 4

        const node: GraphNode = {
          id: account.id,
          label: account.domain.substring(0, 15),
          type: 'account',
          size: 0.4 + (account.passwordStored ? 0.2 : 0),
          color: typeColors[account.category.toLowerCase()] || typeColors.account,
          position: [
            catNode.position[0] + Math.cos(baseAngle + spreadAngle) * distance,
            height,
            catNode.position[2] + Math.sin(baseAngle + spreadAngle) * distance
          ],
          connections: [`cat-${account.category}`]
        }
        generatedNodes.push(node)

        generatedLinks.push({
          source: account.id,
          target: `cat-${account.category}`,
          strength: 1
        })
      })

      // Add central node
      generatedNodes.push({
        id: 'center',
        label: 'AEGIS',
        type: 'service',
        size: 1.2,
        color: '#00d4ff',
        position: [0, 0, 0],
        connections: categories.map(c => `cat-${c}`)
      })

      categories.forEach(cat => {
        generatedLinks.push({
          source: 'center',
          target: `cat-${cat}`,
          strength: 2
        })
      })

      setNodes(generatedNodes)
      setLinks(generatedLinks)
      setStats({
        nodes: generatedNodes.length,
        links: generatedLinks.length,
        categories: categories.length
      })
    } catch (err) {
      console.error('Failed to generate graph:', err)
    }
  }

  const selectedNodeData = nodes.find(n => n.id === selectedNode)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Knowledge Graph</h1>
              <p className="text-gray-400 text-sm">3D visualization of your digital footprint</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="text-gray-400">
                <span className="text-white font-medium">{stats.nodes}</span> nodes
              </div>
              <div className="text-gray-400">
                <span className="text-white font-medium">{stats.links}</span> connections
              </div>
              <div className="text-gray-400">
                <span className="text-white font-medium">{stats.categories}</span> categories
              </div>
            </div>
            <button
              onClick={loadGraphData}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-b border-gray-800 flex gap-4 overflow-x-auto">
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-400 capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* 3D Canvas */}
        <div className="flex-1 bg-gray-950">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-gray-400 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Loading graph data...
              </div>
            </div>
          ) : (
            <Canvas camera={{ position: [15, 10, 15], fov: 60 }}>
              <color attach="background" args={['#0a0a0f']} />
              <fog attach="fog" args={['#0a0a0f', 20, 50]} />
              <Scene
                nodes={nodes}
                links={links}
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
              />
            </Canvas>
          )}
        </div>

        {/* Side panel */}
        {selectedNodeData && (
          <div className="w-80 border-l border-gray-800 p-4 bg-gray-900">
            <h3 className="text-lg font-semibold text-white mb-4">Node Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase">Label</label>
                <p className="text-white">{selectedNodeData.label}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Type</label>
                <p className="text-white capitalize">{selectedNodeData.type}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Connections</label>
                <p className="text-white">{selectedNodeData.connections.length}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Position</label>
                <p className="text-gray-400 text-sm font-mono">
                  x: {selectedNodeData.position[0].toFixed(2)}<br />
                  y: {selectedNodeData.position[1].toFixed(2)}<br />
                  z: {selectedNodeData.position[2].toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div className="px-6 py-3 border-t border-gray-800 flex justify-center gap-8 text-sm text-gray-500">
        <span>Drag to rotate</span>
        <span>Scroll to zoom</span>
        <span>Click node to select</span>
      </div>
    </div>
  )
}
