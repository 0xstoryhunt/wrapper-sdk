import { fetchInBatches } from '../config'
import { TOKEN_NEIGHBOUR_QUERY } from './queries'

async function buildGraphWithHeuristics(
  startToken: string,
  endToken: string,
  depth: number,
): Promise<Map<string, Map<string, number>>> {
  const graph: Map<string, Map<string, number>> = new Map()
  const visited: Set<string> = new Set()
  let currentLevel: string[] = [startToken]

  visited.add(startToken)

  for (let i = 0; i < depth; i++) {
    const nextLevel: string[] = []

    // Fetch all results in parallel for current level
    const results = await fetchInBatches(
      currentLevel.map((node) => ({
        query: TOKEN_NEIGHBOUR_QUERY,
        variables: { tokenId: node?.toLowerCase() },
      })),
    )
    console.log('Results: ', results)

    // Filter results where neighbors include endToken
    const resultsWithEndToken = results.filter(({ result }) =>
      result.data.token.neighbour.some((neighbour: any) => neighbour.id === endToken),
    )

    if (resultsWithEndToken.length > 0) {
      // Process the first result containing the endToken
      for (const {
        variables: { tokenId },
        result,
      } of resultsWithEndToken) {
        const neighbours = result.data.token.neighbour
        const endTokenData = neighbours.find((neighbour: any) => neighbour.id === endToken)

        const heuristicWeight = 1 / Number(endTokenData.totalValueLocked) || Infinity // Inverse TVL

        // Add direct connection to the graph
        graph.set(tokenId, new Map())
        graph.get(tokenId)?.set(endToken, heuristicWeight)
        graph.set(endToken, new Map())
        graph.get(endToken)?.set(tokenId, heuristicWeight)

        return graph // Early return since we found the endToken
      }
    } else {
      // Process remaining results
      for (const {
        variables: { tokenId },
        result,
      } of results) {
        const neighbours = result.data.token.neighbour

        for (const neighbour of neighbours) {
          const neighbourId = neighbour.id
          const heuristicWeight = 1 / Number(neighbour.totalValueLocked) || Infinity // Inverse TVL

          if (!visited.has(neighbourId)) {
            if (!graph.has(tokenId)) graph.set(tokenId, new Map())
            if (!graph.has(neighbourId)) graph.set(neighbourId, new Map())

            graph.get(tokenId)?.set(neighbourId, heuristicWeight)
            graph.get(neighbourId)?.set(tokenId, heuristicWeight) // Undirected graph

            nextLevel.push(neighbourId)
            visited.add(neighbourId)
          }
        }
      }
    }

    currentLevel = nextLevel

    // Break if no more neighbors to explore
    if (nextLevel.length === 0) break
  }

  return graph
}

// A* Algorithm with Heuristic (TVL-Based)
export async function findOptimalPathAStar(
  startToken: string,
  endToken: string,
  depth: number,
): Promise<{ path: string[]; cost: number }> {
  const graph = await buildGraphWithHeuristics(startToken, endToken, depth)
  console.log('Graph: ', graph)

  const openSet: Set<string> = new Set([startToken])
  const cameFrom: Map<string, string | null> = new Map()
  const gScore: Map<string, number> = new Map() // Cost from start to current
  const fScore: Map<string, number> = new Map() // Estimated cost to end

  for (const node of graph.keys()) {
    gScore.set(node, Infinity)
    fScore.set(node, Infinity)
    cameFrom.set(node, null)
  }

  gScore.set(startToken, 0)
  fScore.set(startToken, heuristicCostEstimate(startToken, endToken, graph))

  while (openSet.size > 0) {
    const current = Array.from(openSet).reduce((lowest, node) =>
      fScore.get(node)! < fScore.get(lowest)! ? node : lowest,
    )

    if (current === endToken) {
      const path = reconstructPath(cameFrom, current)
      return { path, cost: gScore.get(endToken)! }
    }

    openSet.delete(current)

    const neighbors = graph.get(current)
    if (!neighbors) continue

    for (const [neighbor, weight] of neighbors.entries()) {
      const tentativeGScore = gScore.get(current)! + weight

      if (tentativeGScore < gScore.get(neighbor)!) {
        cameFrom.set(neighbor, current)
        gScore.set(neighbor, tentativeGScore)
        fScore.set(neighbor, tentativeGScore + heuristicCostEstimate(neighbor, endToken, graph))

        openSet.add(neighbor)
      }
    }
  }

  return { path: [], cost: Infinity } // No path found
}

function heuristicCostEstimate(current: string, target: string, graph: Map<string, Map<string, number>>): number {
  // Use TVL as heuristic: Prefer paths with higher liquidity
  const neighbors = graph.get(current)
  if (!neighbors || !neighbors.has(target)) return Infinity

  return 1 / neighbors.get(target)! || Infinity // Inverse TVL
}

function reconstructPath(cameFrom: Map<string, string | null>, current: string): string[] {
  const path: string[] = []
  while (current) {
    path.unshift(current)
    current = cameFrom.get(current) || ''
  }
  return path
}
