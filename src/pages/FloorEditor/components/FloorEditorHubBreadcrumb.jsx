import { Fragment } from 'react'
import { Link } from 'react-router-dom'

/**
 * @param {{ items: Array<{ label: string, to?: string }> }} props
 */
export default function FloorEditorHubBreadcrumb({ items }) {
  return (
    <nav className="fe-hub-breadcrumb" aria-label="Navegación">
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 && <span className="fe-hub-breadcrumb__sep">/</span>}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
