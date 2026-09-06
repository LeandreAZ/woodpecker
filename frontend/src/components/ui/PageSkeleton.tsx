type SkeletonLayout = 'dashboard' | 'detail' | 'stats' | 'history' | 'settings' | 'solver' | 'form';
function Rows({ count = 3 }: { count?: number }) {
  return <>{Array.from({ length: count }, (_, i) => <div className="ui-page-skeleton__row" key={i}><i /><i /></div>)}</>;
}
export function PageSkeleton({ layout = 'dashboard' }: { layout?: SkeletonLayout }) {
  return <section role="status" aria-label="Chargement de la page" aria-busy="true" className={`ui-page-skeleton ui-page-skeleton--${layout}`}>
    <div className="ui-page-skeleton__header" aria-hidden="true"><i /><i /></div>
    {layout === 'history' ? <div className="ui-page-skeleton__section" aria-hidden="true"><div className="ui-page-skeleton__filters"><i /><i /><i /></div><Rows count={6} /></div>
    : layout === 'form' ? <div className="ui-page-skeleton__section" aria-hidden="true"><i /><i className="ui-page-skeleton__field" /><i /><i className="ui-page-skeleton__textarea" /><i className="ui-page-skeleton__field" /></div>
    : <div className="ui-page-skeleton__grid" aria-hidden="true">{Array.from({ length: layout === 'solver' ? 2 : layout === 'detail' ? 7 : 4 }, (_, i) => <div className="ui-page-skeleton__card" key={i}><i /><i /><i /></div>)}</div>}
    {layout === 'dashboard' && <div className="ui-page-skeleton__section" aria-hidden="true"><i /><Rows count={1} /><i className="ui-page-skeleton__progress" /><div className="ui-page-skeleton__filters"><i /><i /></div></div>}
    {['dashboard', 'detail'].includes(layout) && <div className="ui-page-skeleton__section" aria-hidden="true"><i /><Rows /></div>}
    {layout === 'stats' && <div className="ui-page-skeleton__charts" aria-hidden="true"><div className="ui-page-skeleton__section"><i /><i className="ui-page-skeleton__chart" /></div><div className="ui-page-skeleton__section"><i /><i className="ui-page-skeleton__chart" /></div></div>}
  </section>;
}
