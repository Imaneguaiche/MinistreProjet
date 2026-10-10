const LABELS = {
  nouvelle: 'Nouvelle', en_attente: 'En attente', affectee: 'Affectée',
  en_cours: 'En cours', resolue: 'Résolue', cloturee: 'Clôturée',
  rejetee: 'Rejetée', disponible: 'Disponible', indisponible: 'Occupé',
  basse: 'Basse', normale: 'Normale', haute: 'Haute', urgente: 'Urgente',
  terminee: 'Terminée', annulee: 'Annulée', en_panne: 'En panne',
  fonctionnel: 'Fonctionnel', en_reparation: 'En maintenance', hors_service: 'Hors service',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
