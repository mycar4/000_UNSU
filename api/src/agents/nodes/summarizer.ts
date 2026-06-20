import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { AgentStateAnnotation } from '../state.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function summarizerNode(state: typeof AgentStateAnnotation.State) {
  try {
    console.log('[summarizerNode] Generating final recommendation report & TTS script...')
    if (state.error) return {}

    const query = state.userQuery
    const matched = state.hotzones || []
    
    let hotzoneLines = ''
    let ttsText = `${query} 지역 실시간 교통 분석 브리핑입니다. `
    let zoneStatus = 'normal'
    
    if (matched.length > 0) {
      matched.forEach((z, i) => {
        const gradeStr = z.status === 'critical' ? '혼잡' : z.status === 'warning' ? '보통' : '원활'
        hotzoneLines += `- **${z.area}**: ${z.demand} (상태: ${gradeStr})\n`
        if (z.status === 'critical') zoneStatus = 'critical'
        else if (z.status === 'warning' && zoneStatus !== 'critical') zoneStatus = 'warning'

        if (i < 2) {
          ttsText += `현재 ${z.area} 부근은 ${z.demand} 상태이며, 주행 진입 시 매칭 확률이 높습니다. `
        }
      })
    } else {
      hotzoneLines = '- **검색 결과 없음**: 현재 활성화된 돌발 트래픽 핫존이 존재하지 않습니다.\n'
      ttsText += '현재 주변 도로에 특이사항이 발견되지 않았습니다. 안전 운행을 권장합니다.'
    }

    const report = `### [AI 오디오 관제 브리핑] ${query} 지역 리포트\n\n` +
      `**${query}** 지역의 실시간 혼잡도 및 호출 수요 분석 결과입니다.\n\n` +
      hotzoneLines + '\n' +
      `- **수익 팁**: 해당 지역 진입 시 시간당 매출이 평균 35% 상승할 것으로 보입니다.\n\n` +
      `> [!TIP]\n` +
      `> 전방 주시 중심의 운행을 유지하기 위해 무인 스트리밍(Zero-Touch) 라디오 채널을 가동 중입니다.`

    // Obsidian Integration: Save RAG report to markdown in z_history/reports/
    try {
      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-')
      const reportFilename = `report_${timestampStr}.md`
      const reportDir = path.resolve(__dirname, '..', '..', '..', '..', 'z_history', 'reports')
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true })
      }
      const reportPath = path.join(reportDir, reportFilename)
      const createdAt = new Date().toISOString()
      
      const mdContent = `---
type: report
query: "${query}"
status: "${zoneStatus}"
date: "${createdAt}"
---

# UNSU 플랫폼 AI 운행 추천 리포트

${report}
`
      fs.writeFileSync(reportPath, mdContent, 'utf8')
      console.log(`[Obsidian] Saved AI recommendation report: ${reportFilename}`)
    } catch (fileErr: any) {
      console.warn('[Obsidian] Failed to save AI report markdown:', fileErr.message)
    }

    return {
      report,
      audioScript: ttsText
    }
  } catch (error: any) {
    return { error: `Summarizer error: ${error.message || error}` }
  }
}

