export default function PageHeader({ eyebrow, title, description, icon: Icon, actions }) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        {Icon && (
          <span className="page-header-icon" aria-hidden="true">
            <Icon />
          </span>
        )}
        <div>
          {eyebrow && <span className="page-kicker">{eyebrow}</span>}
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
