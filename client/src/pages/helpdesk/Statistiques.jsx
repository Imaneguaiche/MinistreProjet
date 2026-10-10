import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import api from '../../services/api'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LabelList
} from 'recharts'
import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import jsPDF from 'jspdf'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { useAuth } from '../../context/AuthContext'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9']

/* ─── helpers ─────────────────────────────────────────────── */
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])
  return width
}

const now = () => new Date().toLocaleDateString('fr-FR')
const imgToBase64 = (src) =>
  new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width; c.height = img.height
      c.getContext('2d').drawImage(img, 0, 0)
      res(c.toDataURL('image/png'))
    }
    img.onerror = rej
    img.src = src
  })

/* ══════════════════════════════════════════════════════════════
   PDF EXPORT  –  tables only, pure jsPDF (no plugin)
   ══════════════════════════════════════════════════════════════ */
const exportPDF = async (stats, user) => {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W     = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const BM    = 20  // bottom margin reserve
  const LM    = 16  // left margin
  const RM    = 16  // right margin
  const CW    = W - LM - RM  // content width
  let y = 10

  /* ── palette ── */
  const navy   = [13,  27,  42]
  const slate  = [71,  85,  105]
  const light  = [241, 245, 249]
  const border = [203, 213, 225]
  const white  = [255, 255, 255]
  const alt    = [248, 250, 252]

  /* ── Logo ── */
  try {
    const b64 = await imgToBase64('/logo_report.png')
    const ratio = 38 / 90 // maintaining previous aspect ratio
    const logoW = CW * 0.75 // 75% of content width (un peu plus petit que 100%)
    const logoH = logoW * ratio
    doc.addImage(b64, 'PNG', W / 2 - (logoW / 2), y, logoW, logoH)
    y += logoH + 4
  } catch { y += 2 }

  /* ── Title ── */
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...navy)
  doc.text('Rapport Analytique HelpDesk', W / 2, y, { align: 'center' })
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...slate)
  doc.text('Ministère de la Transition Énergétique et du Développement Durable', W / 2, y, { align: 'center' })
  y += 6

  /* ── Agent + Date ── */
  doc.setFontSize(9)
  doc.text(`Agent HelpDesk : ${user?.nom ?? ''} ${user?.prenom ?? ''}`, LM, y)
  doc.text(`Date : ${now()}`, W - RM, y, { align: 'right' })
  y += 3

  doc.setDrawColor(...border)
  doc.setLineWidth(0.35)
  doc.line(LM, y, W - RM, y)
  y += 6

  /* ══════════════════════════════════════════════
     Native table drawing helper
     cols: [{ label, width, align }]
     rows: array of string/number arrays
  ══════════════════════════════════════════════ */
  const ROW_H   = 7.5
  const HEAD_H  = 8.5
  const SEC_H   = 9

  const needsPage = (neededH) => {
    if (y + neededH > pageH - BM) { doc.addPage(); y = 14 }
  }

  const drawSectionHeader = (title) => {
    needsPage(SEC_H + HEAD_H + ROW_H * 2)
    doc.setFillColor(...navy)
    doc.roundedRect(LM, y, CW, SEC_H, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...white)
    doc.text(title, LM + 4, y + 6.2)
    y += SEC_H + 3
  }

  const drawTable = (cols, rows) => {
    /* header row */
    needsPage(HEAD_H + ROW_H)
    let x = LM
    doc.setFillColor(...light)
    doc.rect(LM, y, CW, HEAD_H, 'F')
    doc.setDrawColor(...border)
    doc.setLineWidth(0.25)
    doc.rect(LM, y, CW, HEAD_H, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...navy)

    cols.forEach(col => {
      doc.text(col.label, x + col.width / 2, y + 5.8, { align: 'center', maxWidth: col.width - 2 })
      x += col.width
    })
    y += HEAD_H

    /* data rows */
    rows.forEach((row, ri) => {
      needsPage(ROW_H + 2)
      if (ri % 2 === 1) {
        doc.setFillColor(...alt)
        doc.rect(LM, y, CW, ROW_H, 'F')
      }
      doc.setDrawColor(...border)
      doc.setLineWidth(0.2)
      doc.rect(LM, y, CW, ROW_H, 'S')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...slate)

      let cx = LM
      cols.forEach((col, ci) => {
        const val = String(row[ci] ?? '—')
        const align = col.align ?? (ci === 0 ? 'left' : 'center')
        const tx = align === 'center' ? cx + col.width / 2 : (align === 'right' ? cx + col.width - 2 : cx + 3)
        doc.text(val, tx, y + 5.2, { align, maxWidth: col.width - 4 })
        cx += col.width
      })
      y += ROW_H
    })
    y += 10
  }

  /* ─── A) KPI ─────────────────────────────────── */
  drawSectionHeader('Indicateurs de Performance (KPIs)')
  drawTable(
    [{ label: 'Indicateur', width: CW * 0.72 }, { label: 'Valeur', width: CW * 0.28, align: 'center' }],
    [
      ["Demandes reçues aujourd'hui", stats.demandes_aujourdhui ?? 0],
      ["En attente d'affectation",   stats.demandes_nouvelles  ?? 0],
      ["Temps moyen de résolution",  stats.duree_moyenne_resolution
        ? `${parseFloat(stats.duree_moyenne_resolution).toFixed(1)} h` : 'Non disponible'],
      ["Réclamations de retard",     stats.reclamations_retard ?? 0],
    ]
  )

  /* ─── B) Statuts ─────────────────────────────── */
  drawSectionHeader('Répartition des Tâches par Statut')
  drawTable(
    [
      { label: '#',                    width: CW * 0.08, align: 'center' },
      { label: 'Statut',               width: CW * 0.65 },
      { label: 'Nombre de demandes',   width: CW * 0.27, align: 'center' },
    ],
    (stats.par_tache_statut || []).map((s, i) => [i + 1, s.statut, s.total])
  )

  /* ─── C) Matériels ───────────────────────────── */
  drawSectionHeader('Top Equipements en Panne')
  drawTable(
    [
      { label: 'Classement',         width: CW * 0.15, align: 'center' },
      { label: 'Materiel / Modele',  width: CW * 0.60 },
      { label: 'Nb. pannes',         width: CW * 0.25, align: 'center' },
    ],
    (stats.materiels_panne || []).map((m, i) => [`#${i + 1}`, m.nom, m.total])
  )

  /* ─── D) Départements ────────────────────────── */
  drawSectionHeader('Departements les Plus Touches')
  drawTable(
    [
      { label: '#',                      width: CW * 0.08, align: 'center' },
      { label: 'Departement concerne',   width: CW * 0.67 },
      { label: 'Incidents',              width: CW * 0.25, align: 'center' },
    ],
    (stats.par_departement || []).map((d, i) => [i + 1, d.nom, d.total])
  )

  /* ── Footer on every page ── */
  const pgCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pgCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...border)
    doc.setDrawColor(...border)
    doc.setLineWidth(0.3)
    doc.line(LM, pageH - 10, W - RM, pageH - 10)
    doc.text('HelpDesk System — Ministère', LM, pageH - 6)
    doc.text(`Page ${i} / ${pgCount}`, W - RM, pageH - 6, { align: 'right' })
  }

  doc.save(`rapport_helpdesk_${now().replace(/\//g, '-')}.pdf`)
}

/* ══════════════════════════════════════════════════════════════
   EXCEL EXPORT  –  tables only, structured professional report
   ══════════════════════════════════════════════════════════════ */
const exportExcel = async (stats, rapports, user) => {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'HelpDesk System'

  /* ── Shared styles ── */
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1B2A' } }
  const sectionFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
  const altFill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
  const lightFill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
  const thinBorder  = { style: 'thin', color: { argb: 'FFCBD5E1' } }
  const allBorders  = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder }

  const applyBorder = (cell) => { cell.border = allBorders }

  /* ─────────────────────────────────────────────────────────
     WORKSHEET 1 — Rapport Statistique
  ───────────────────────────────────────────────────────── */
  const ws = wb.addWorksheet('Rapport Statistique', { views: [{ showGridLines: false }] })
  ws.columns = [
    { width: 5 }, { width: 42 }, { width: 22 }, { width: 42 }, { width: 22 }
  ]

  /* Logo */
  let logoId = null
  try {
    const b64 = await imgToBase64('/logo_report.png')
    logoId = wb.addImage({ base64: b64, extension: 'png' })
    ws.addImage(logoId, { tl: { col: 0.6, row: 0.5 }, br: { col: 4.4, row: 5 }, editAs: 'absolute' })
    for (let r = 1; r <= 5; r++) ws.getRow(r).height = 15
  } catch { /* logo optional */ }

  /* Title */
  ws.mergeCells('B7:E7')
  const t = ws.getCell('B7')
  t.value = 'RAPPORT ANALYTIQUE HELPDESK'
  t.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF0D1B2A' } }
  t.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(7).height = 26

  ws.mergeCells('B8:E8')
  const sub = ws.getCell('B8')
  sub.value = 'Ministère de la Transition Énergétique et du Développement Durable'
  sub.font = { name: 'Arial', size: 10, color: { argb: 'FF64748B' } }
  sub.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(8).height = 18

  ws.mergeCells('B9:E9')
  ws.getRow(9).height = 6

  ws.mergeCells('B10:C10')
  const ag = ws.getCell('B10')
  ag.value = `Agent HelpDesk : ${user?.nom ?? ''} ${user?.prenom ?? ''}`
  ag.font = { bold: true, size: 10, color: { argb: 'FF334155' } }
  ag.alignment = { vertical: 'middle' }

  ws.mergeCells('D10:E10')
  const dt = ws.getCell('D10')
  dt.value = `Date d'export : ${now()}`
  dt.font = { bold: true, size: 10, color: { argb: 'FF334155' } }
  dt.alignment = { horizontal: 'right', vertical: 'middle' }
  ws.getRow(10).height = 20

  ws.mergeCells('B11:E11')
  ws.getRow(11).height = 8

  /* ── Section builder ── */
  let row = 12
  const addSection = (title) => {
    ws.mergeCells(`B${row}:E${row}`)
    const cell = ws.getCell(`B${row}`)
    cell.value = title
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = sectionFill
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    ws.getRow(row).height = 22
    row++
  }

  const addTableHeader = (cols) => {
    const r = ws.getRow(row)
    r.height = 18
    cols.forEach((label, ci) => {
      const col = ci + 2  // start at column B=2
      const cell = ws.getCell(row, col)
      cell.value = label
      cell.font = { bold: true, size: 10, color: { argb: 'FF0D1B2A' } }
      cell.fill = lightFill
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      applyBorder(cell)
    })
    row++
  }

  const addTableRow = (values, isAlt = false) => {
    const r = ws.getRow(row)
    r.height = 16
    values.forEach((val, ci) => {
      const cell = ws.getCell(row, ci + 2)
      cell.value = val
      cell.font = { size: 10 }
      if (isAlt) cell.fill = altFill
      cell.alignment = { vertical: 'middle', horizontal: ci === 0 ? 'left' : 'center', indent: ci === 0 ? 1 : 0 }
      applyBorder(cell)
    })
    row++
  }

  const addGap = (n = 1) => { row += n }

  /* ─── A) KPI ─── */
  addSection('📊  Indicateurs de Performance (KPIs)')
  addTableHeader(['Indicateur', 'Valeur'])
  const kpis = [
    ["Demandes reçues aujourd'hui", stats.demandes_aujourdhui ?? 0],
    ["En attente d'affectation",   stats.demandes_nouvelles  ?? 0],
    ["Temps moyen de résolution",  stats.duree_moyenne_resolution ? `${parseFloat(stats.duree_moyenne_resolution).toFixed(1)} h` : 'N/A'],
    ["Réclamations de retard",     stats.reclamations_retard ?? 0],
  ]
  kpis.forEach((r, i) => addTableRow(r, i % 2 !== 0))
  addGap(2)

  /* ─── B) Statuts ─── */
  addSection('📋  Répartition des Tâches par Statut')
  addTableHeader(['Statut', 'Nombre de demandes'])
  ;(stats.par_tache_statut || []).forEach((s, i) => addTableRow([s.statut, s.total], i % 2 !== 0))
  addGap(2)

  /* ─── C) Matériels ─── */
  addSection('⚙️  Top Équipements en Panne')
  addTableHeader(['Classement', 'Matériel / Modèle', 'Nombre de pannes'])
  ;(stats.materiels_panne || []).forEach((m, i) => addTableRow([`#${i + 1}`, m.nom, m.total], i % 2 !== 0))
  addGap(2)

  /* ─── D) Départements ─── */
  addSection('🏢  Départements les Plus Touchés')
  addTableHeader(['#', 'Département concerné', 'Incidents signalés'])
  ;(stats.par_departement || []).forEach((d, i) => addTableRow([i + 1, d.nom, d.total], i % 2 !== 0))

  /* ─────────────────────────────────────────────────────────
     WORKSHEET 2 — Détails des Rapports
  ───────────────────────────────────────────────────────── */
  const ws2 = wb.addWorksheet('Détails des Rapports', { views: [{ showGridLines: false }] })
  const heads2 = [
    'ID', 'Technicien', 'Demandeur', 'Département',
    'Matériel', 'Catégorie', 'Statut demande',
    'Durée (h)', 'Date début', 'Date fin', 'Réclamation retard', 'Remarque technicien'
  ]
  ws2.columns = [
    { width: 8 }, { width: 24 }, { width: 24 }, { width: 28 },
    { width: 26 }, { width: 20 }, { width: 18 },
    { width: 12 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 40 }
  ]

  const hRow = ws2.getRow(1)
  hRow.values = heads2
  hRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
  hRow.fill = headerFill
  hRow.height = 20
  hRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  heads2.forEach((_, i) => applyBorder(ws2.getCell(1, i + 1)))

  rapports.forEach((r, idx) => {
    const d = r.intervention?.demande || {}
    const t = r.intervention?.technicien || {}
    const vals = [
      `R-${r.id}`,
      t.nom ? `${t.prenom} ${t.nom}` : '—',
      d.personnel ? `${d.personnel.prenom} ${d.personnel.nom}` : '—',
      d.personnel?.departement?.nom_departement || '—',
      d.materiel?.nom_materiel || '—',
      d.categorie?.libelle || '—',
      d.statut || '—',
      r.duree ? (r.duree / 60).toFixed(1) : '—',
      r.intervention?.date_debut ? new Date(r.intervention.date_debut).toLocaleString('fr-FR') : '—',
      r.intervention?.date_fin  ? new Date(r.intervention.date_fin).toLocaleString('fr-FR')  : '—',
      (d.reclamations?.length > 0) ? 'Oui' : 'Non',
      r.remarque || '—',
    ]
    const rw = ws2.getRow(idx + 2)
    rw.values = vals
    rw.height = 15
    rw.font = { size: 9 }
    if (idx % 2 !== 0) rw.fill = altFill
    vals.forEach((_, i) => applyBorder(ws2.getCell(idx + 2, i + 1)))
  })

  /* Save */
  const buf = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buf]), `rapport_helpdesk_${now().replace(/\//g, '-')}.xlsx`)
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function HelpdeskStatistiques() {
  const { user } = useAuth()
  const [stats, setStats]       = useState(null)
  const [rapports, setRapports] = useState([])
  const [loading, setLoading]   = useState(true)
  const [exporting, setExporting] = useState(false)
  const [feedback, setFeedback]   = useState('')
  const [apiError, setApiError]   = useState(null)
  const width = useWindowWidth()

  /* ── fetch ── */
  const fetchStats = async (init = false) => {
    if (init) { setLoading(true); setApiError(null) }
    try {
      const [rS, rR] = await Promise.all([api.get('/stats/helpdesk'), api.get('/rapports')])
      setStats(rS.data)
      setRapports(rR.data || [])
    } catch { if (init) setApiError('Impossible de charger les statistiques.') }
    finally  { if (init) setLoading(false) }
  }

  useEffect(() => {
    fetchStats(true)
    const id = setInterval(() => fetchStats(false), 10000)
    return () => clearInterval(id)
  }, [])

  /* ── export handlers ── */
  const handlePDF = async () => {
    setExporting(true); setFeedback('Génération du PDF...')
    try { await exportPDF(stats, user); setFeedback('✅ PDF généré !') }
    catch (e) { console.error(e); setFeedback('❌ Erreur PDF.') }
    setExporting(false)
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleExcel = async () => {
    setExporting(true); setFeedback('Génération du fichier Excel...')
    try { await exportExcel(stats, rapports, user); setFeedback('✅ Excel généré !') }
    catch (e) { console.error(e); setFeedback('❌ Erreur Excel.') }
    setExporting(false)
    setTimeout(() => setFeedback(''), 3000)
  }

  const handlePrint = () => window.print()

  /* ── guards ── */
  if (loading) return <Layout title="Statistiques"><p style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Chargement des statistiques...</p></Layout>
  if (apiError) return <Layout title="Statistiques"><div style={{ textAlign: 'center', color: '#ef4444', padding: '3rem', fontWeight: 600 }}>{apiError}</div></Layout>
  if (!stats)   return null

  /* ── shared inline styles ── */
  const sectionHeaderStyle = {
    background: '#0d1b2a', color: '#fff',
    padding: '9px 14px', borderRadius: '8px 8px 0 0',
    fontSize: '0.92rem', fontWeight: 800,
    display: 'flex', alignItems: 'center', gap: '8px',
  }
  const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#fff' }
  const thStyle = { border: '1px solid #cbd5e1', padding: '11px 14px', textAlign: 'left', color: '#334155', fontWeight: 700, background: '#f1f5f9' }
  const thCenterStyle = { ...thStyle, textAlign: 'center' }
  const tdStyle = { border: '1px solid #e2e8f0', padding: '10px 14px', color: '#475569' }
  const tdCenterStyle = { ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#0f172a' }
  const wrapStyle = { borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', background: '#fff' }

  const gridCols = 'repeat(auto-fill, minmax(310px, 1fr))'
  const chartHeight = 300

  return (
    <Layout title="Statistiques">
      {/* ── Page header (screen only) ── */}
      <div className="page-header no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Tableau de bord statistiques</h1>
          <p style={{ margin: 0, marginTop: '4px' }}>Vue d'ensemble des interventions</p>
        </div>
        <div className="export-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {feedback && <span style={{ color: 'var(--navy)', fontWeight: 600, fontSize: '0.85rem' }}>{feedback}</span>}
          <button className="btn btn-secondary" onClick={handlePDF}   disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Download size={16} /> PDF</button>
          <button className="btn btn-secondary" onClick={handleExcel} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileSpreadsheet size={16} /> Excel</button>
          <button className="btn btn-primary"   onClick={handlePrint} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Printer size={16} /> Imprimer</button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          PRINT-ONLY REPORT  (hidden on screen, shown on print)
         ════════════════════════════════════════════════════════ */}
      <div id="print-report" className="print-only" style={{ display: 'none' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '14px', marginBottom: '20px' }}>
          <img src="/logo_report.png" alt="Logo" style={{ width: '80%', height: 'auto', objectFit: 'contain', marginBottom: '8px', display: 'block', margin: '0 auto' }} />
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0d1b2a', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rapport Analytique HelpDesk</h1>
          <p style={{ margin: '0', color: '#64748b', fontSize: '13px' }}>Ministère de la Transition Énergétique et du Développement Durable</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
            <span>Agent HelpDesk : {user?.nom} {user?.prenom}</span>
            <span>Date d'export : {now()}</span>
          </div>
        </div>

        {/* A) KPIs */}
        <div style={{ marginBottom: '24px', breakInside: 'avoid' }}>
          <div style={sectionHeaderStyle}>📊 Indicateurs de Performance (KPIs)</div>
          <table style={tableStyle}>
            <thead><tr>
              <th style={thStyle}>Indicateur</th>
              <th style={thCenterStyle}>Valeur</th>
            </tr></thead>
            <tbody>
              {[
                ["Demandes reçues aujourd'hui", stats.demandes_aujourdhui ?? 0],
                ["En attente d'affectation",   stats.demandes_nouvelles  ?? 0],
                ["Temps moyen de résolution",  stats.duree_moyenne_resolution ? `${parseFloat(stats.duree_moyenne_resolution).toFixed(1)} h` : 'Non disponible'],
                ["Réclamations de retard",     stats.reclamations_retard ?? 0],
              ].map(([label, val], i) => (
                <tr key={i} style={{ background: i % 2 !== 0 ? '#f8fafc' : '#fff' }}>
                  <td style={tdStyle}>{label}</td>
                  <td style={tdCenterStyle}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* B) Statuts */}
        <div style={{ marginBottom: '24px', breakInside: 'avoid' }}>
          <div style={sectionHeaderStyle}>📋 Répartition des Tâches par Statut</div>
          <table style={tableStyle}>
            <thead><tr>
              <th style={{ ...thStyle, width: '50px', textAlign: 'center' }}>#</th>
              <th style={thStyle}>Statut</th>
              <th style={thCenterStyle}>Nombre de demandes</th>
            </tr></thead>
            <tbody>
              {(stats.par_tache_statut || []).map((s, i) => (
                <tr key={i} style={{ background: i % 2 !== 0 ? '#f8fafc' : '#fff' }}>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                  <td style={tdStyle}>{s.statut}</td>
                  <td style={tdCenterStyle}>{s.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* C) Matériels */}
        <div style={{ marginBottom: '24px', breakInside: 'avoid' }}>
          <div style={sectionHeaderStyle}>⚙️ Top Équipements en Panne</div>
          <table style={tableStyle}>
            <thead><tr>
              <th style={{ ...thStyle, width: '70px', textAlign: 'center' }}>Classement</th>
              <th style={thStyle}>Matériel / Modèle</th>
              <th style={thCenterStyle}>Nombre de pannes</th>
            </tr></thead>
            <tbody>
              {(stats.materiels_panne || []).map((m, i) => (
                <tr key={i} style={{ background: i % 2 !== 0 ? '#f8fafc' : '#fff' }}>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#dc2626', fontWeight: 800 }}>#{i + 1}</td>
                  <td style={tdStyle}>{m.nom}</td>
                  <td style={tdCenterStyle}>{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* D) Départements */}
        <div style={{ marginBottom: '24px', breakInside: 'avoid' }}>
          <div style={sectionHeaderStyle}>🏢 Départements les Plus Touchés</div>
          <table style={tableStyle}>
            <thead><tr>
              <th style={{ ...thStyle, width: '50px', textAlign: 'center' }}>#</th>
              <th style={thStyle}>Département concerné</th>
              <th style={thCenterStyle}>Incidents signalés</th>
            </tr></thead>
            <tbody>
              {(stats.par_departement || []).map((d, i) => (
                <tr key={i} style={{ background: i % 2 !== 0 ? '#f8fafc' : '#fff' }}>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                  <td style={tdStyle}>{d.nom}</td>
                  <td style={tdCenterStyle}>{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Print footer */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: '1px solid #e2e8f0', padding: '6px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', background: '#fff' }}>
          <span>HelpDesk System — Ministère</span>
          <span>Généré le {now()}</span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          DASHBOARD CHARTS  (screen only)
         ════════════════════════════════════════════════════════ */}
      <div id="dashboard-charts" className="no-print" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '20px', width: '100%', marginTop: '28px' }}>

        <style>{`
          @keyframes fadeInUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
          .chart-pro-card { background:#fff; border-radius:16px; padding:20px 22px 18px; box-shadow:0 8px 25px rgba(0,0,0,.06); position:relative; overflow:hidden; animation:fadeInUp .45s ease both; min-width:0; }
          .chart-pro-card::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; border-radius:16px 16px 0 0; background:var(--accent-color,#3b82f6); }
          .chart-pro-card .chart-bg { position:absolute; inset:0; background:var(--card-bg-gradient,linear-gradient(135deg,rgba(59,130,246,.04) 0%,transparent 60%)); pointer-events:none; }
          .chart-pro-card .chart-title { display:flex; align-items:center; gap:8px; font-weight:700; font-size:.92rem; color:#1e293b; margin-bottom:16px; position:relative; }
          .chart-pro-card .chart-title .icon-badge { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
          .chart-empty { height:240px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:#94a3b8; }
          .chart-empty span { font-size:.82rem; }
        `}</style>

        {/* Chart 1 – Répartition des tâches */}
        <div className="chart-pro-card" style={{ '--accent-color': '#3b82f6', '--card-bg-gradient': 'linear-gradient(135deg, rgba(59,130,246,.05) 0%, transparent 60%)', animationDelay: '0ms' }}>
          <div className="chart-bg" />
          <div className="chart-title">
            <div className="icon-badge" style={{ background: '#eff6ff' }}>📊</div>
            <span>Répartition des tâches</span>
          </div>
          {stats.par_tache_statut?.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={stats.par_tache_statut} dataKey="total" nameKey="statut" cx="50%" cy="48%" innerRadius="38%" outerRadius="62%" paddingAngle={4} isAnimationActive animationBegin={100} animationDuration={900} label={({ percent }) => percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                  {(stats.par_tache_statut || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)', fontSize: '.82rem', padding: '8px 14px' }} itemStyle={{ fontWeight: 600 }} />
                <Legend iconType="circle" iconSize={9} formatter={v => <span style={{ fontSize: '.78rem', color: '#475569', fontWeight: 600 }}>{v}</span>} wrapperStyle={{ paddingTop: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty"><span style={{ fontSize: 30 }}>📭</span><span>Aucune donnée disponible</span></div>}
        </div>

        {/* Chart 2 – Équipements en panne */}
        <div className="chart-pro-card" style={{ '--accent-color': '#ef4444', '--card-bg-gradient': 'linear-gradient(135deg, rgba(239,68,68,.04) 0%, transparent 60%)', animationDelay: '80ms' }}>
          <div className="chart-bg" />
          <div className="chart-title">
            <div className="icon-badge" style={{ background: '#fef2f2' }}>⚙️</div>
            <span>Top équipements en panne</span>
          </div>
          {stats.materiels_panne?.length > 0 ? (
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={stats.materiels_panne} barCategoryGap="40%" margin={{ top: 20, right: 10, bottom: 40, left: 0 }}>
                <defs><linearGradient id="barRedGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fca5a5" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="nom" tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} interval={0} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)', fontSize: '.82rem', padding: '8px 14px' }} cursor={{ fill: 'rgba(239,68,68,.07)', radius: 6 }} itemStyle={{ fontWeight: 700, color: '#ef4444' }} />
                <Bar dataKey="total" fill="url(#barRedGrad)" radius={[6, 6, 0, 0]} maxBarSize={45} isAnimationActive animationBegin={180} animationDuration={900}>
                  <LabelList dataKey="total" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#dc2626' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty"><span style={{ fontSize: 30 }}>📭</span><span>Aucune donnée disponible</span></div>}
        </div>

        {/* Chart 3 – Départements */}
        <div className="chart-pro-card" style={{ '--accent-color': '#f59e0b', '--card-bg-gradient': 'linear-gradient(135deg, rgba(245,158,11,.04) 0%, transparent 60%)', animationDelay: '160ms' }}>
          <div className="chart-bg" />
          <div className="chart-title">
            <div className="icon-badge" style={{ background: '#fffbeb' }}>🏢</div>
            <span>Départements les plus touchés</span>
          </div>
          {stats.par_departement?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.par_departement} barCategoryGap="35%" margin={{ top: 24, right: 12, bottom: 70, left: 0 }}>
                <defs><linearGradient id="barOrangeVert" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fde68a" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="nom" tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}><text x={0} y={0} dy={12} textAnchor="end" transform="rotate(-38)" style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}>{payload.value.length > 18 ? payload.value.slice(0, 17) + '…' : payload.value}</text></g>
                )} interval={0} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.13)', fontSize: '.82rem', padding: '8px 14px', background: '#fff' }} cursor={{ fill: 'rgba(245,158,11,.09)', radius: 6 }} formatter={(value) => [`${value} incident${value > 1 ? 's' : ''}`, 'Incidents']} labelFormatter={(label) => <strong style={{ color: '#1e293b', display: 'block', marginBottom: 2 }}>{label}</strong>} />
                <Bar dataKey="total" fill="url(#barOrangeVert)" radius={[6, 6, 0, 0]} maxBarSize={52} isAnimationActive animationBegin={260} animationDuration={900}>
                  <LabelList dataKey="total" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#d97706' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="chart-empty"><span style={{ fontSize: 30 }}>📭</span><span>Aucune donnée disponible</span></div>}
        </div>
      </div>
    </Layout>
  )
}
