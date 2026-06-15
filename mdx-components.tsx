import katex from "katex"
import { Children, isValidElement } from "react"
import type { ReactNode } from "react"
import type { MDXComponents } from "mdx/types"

function renderMath(expression: string, displayMode: boolean) {
  return katex.renderToString(expression, {
    displayMode,
    throwOnError: false,
    strict: "ignore",
  })
}

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((item) => getTextContent(item)).join("")
  }

  if (isValidElement(node)) {
    return getTextContent(node.props.children)
  }

  return ""
}

function formatCalloutLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function resolveCalloutClasses(type: string) {
  const key = type.toLowerCase()

  if (["warning", "caution", "attention"].includes(key)) {
    return {
      shell: "border-amber-300/70 bg-amber-100/70 text-amber-950",
      badge: "bg-amber-500/15 text-amber-900",
    }
  }

  if (["danger", "error", "fail", "failure", "bug"].includes(key)) {
    return {
      shell: "border-rose-300/70 bg-rose-100/70 text-rose-950",
      badge: "bg-rose-500/15 text-rose-900",
    }
  }

  if (["tip", "success", "check", "done"].includes(key)) {
    return {
      shell: "border-emerald-300/70 bg-emerald-100/70 text-emerald-950",
      badge: "bg-emerald-500/15 text-emerald-900",
    }
  }

  if (["question", "help"].includes(key)) {
    return {
      shell: "border-violet-300/70 bg-violet-100/70 text-violet-950",
      badge: "bg-violet-500/15 text-violet-900",
    }
  }

  return {
    shell: "border-sky-300/70 bg-sky-100/75 text-sky-950",
    badge: "bg-sky-500/15 text-sky-900",
  }
}

function splitCalloutText(value: string) {
  const normalized = value.replace(/\r\n?/g, "\n").trim()
  const match = normalized.match(/^\[!([A-Za-z0-9_-]+)\](?:\s*([+-]))?\s*([^\n]*)(?:\n+([\s\S]*))?$/)
  if (!match) return null

  return {
    type: match[1],
    fold: match[2] === "-" ? "collapsed" : match[2] === "+" ? "expanded" : "static",
    title: match[3].trim(),
    remainder: match[4]?.trim() ?? "",
  }
}

function createMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ className, ...props }) => (
      <h2 className={["section-title-animate mt-12 text-2xl leading-tight md:text-3xl", className].filter(Boolean).join(" ")} {...props} />
    ),
    h3: ({ className, ...props }) => <h3 className={["mt-8 text-xl leading-tight md:text-2xl", className].filter(Boolean).join(" ")} {...props} />,
    p: ({ className, ...props }) => <p className={["mt-4 text-base leading-8 text-muted-foreground", className].filter(Boolean).join(" ")} {...props} />,
    ul: ({ className, ...props }) => {
      const hasTaskList = typeof className === "string" && className.includes("contains-task-list")
      return <ul className={["mt-4 space-y-3", hasTaskList && "list-none pl-0", className].filter(Boolean).join(" ")} {...props} />
    },
    li: ({ className, ...props }) => {
      const isTaskListItem = typeof className === "string" && className.includes("task-list-item")
      return <li className={["text-sm leading-7 text-muted-foreground", isTaskListItem && "flex items-start gap-3 pl-0", className].filter(Boolean).join(" ")} {...props} />
    },
    input: ({ className, type, checked, ...props }) => {
      if (type === "checkbox") {
        return (
          <input
            type="checkbox"
            checked={checked}
            disabled
            className={["mt-1 h-4 w-4 rounded border-border accent-primary", className].filter(Boolean).join(" ")}
            {...props}
          />
        )
      }

      return <input type={type} className={className} checked={checked} {...props} />
    },
    a: ({ className, ...props }) => (
      <a className={["font-medium text-primary underline decoration-border underline-offset-4", className].filter(Boolean).join(" ")} {...props} />
    ),
    img: ({ className, alt, ...props }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={["mt-6 w-full rounded-[1.5rem] border border-border/70 bg-secondary/40 object-cover", className].filter(Boolean).join(" ")}
        alt={alt ?? ""}
        {...props}
      />
    ),
    mark: ({ className, ...props }) => (
      <mark className={["rounded bg-lime-200/80 px-1 py-0.5 text-foreground", className].filter(Boolean).join(" ")} {...props} />
    ),
    table: ({ className, ...props }) => (
      <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-border/70 bg-card/50">
        <table className={["min-w-full border-collapse text-left text-sm", className].filter(Boolean).join(" ")} {...props} />
      </div>
    ),
    thead: ({ className, ...props }) => <thead className={["bg-secondary/80", className].filter(Boolean).join(" ")} {...props} />,
    tbody: ({ className, ...props }) => <tbody className={className} {...props} />,
    tr: ({ className, ...props }) => <tr className={["border-t border-border/60", className].filter(Boolean).join(" ")} {...props} />,
    th: ({ className, ...props }) => (
      <th className={["px-4 py-3 font-medium text-foreground", className].filter(Boolean).join(" ")} {...props} />
    ),
    td: ({ className, ...props }) => (
      <td className={["px-4 py-3 align-top leading-7 text-muted-foreground", className].filter(Boolean).join(" ")} {...props} />
    ),
    pre: ({ className, children, ...props }) => {
      if (isValidElement(children) && typeof children.props.className === "string" && children.props.className.includes("math-display")) {
        return children
      }

      return (
        <pre
          className={[
            "mt-6 overflow-x-auto rounded-[1.5rem] border border-border/70 bg-secondary/80 px-5 py-4 text-sm leading-7 text-foreground",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {children}
        </pre>
      )
    },
    code: ({ className, children, ...props }) => {
      const content = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : ""

      if (typeof className === "string" && className.includes("math-inline")) {
        return (
          <span
            className="mx-1 inline-block align-middle"
            dangerouslySetInnerHTML={{ __html: renderMath(content, false) }}
          />
        )
      }

      if (typeof className === "string" && className.includes("math-display")) {
        return (
          <div
            className="my-6 overflow-x-auto rounded-[1.75rem] border border-border/70 bg-secondary/60 px-5 py-5"
            dangerouslySetInnerHTML={{ __html: renderMath(content, true) }}
          />
        )
      }

      return (
        <code
          className={["rounded bg-secondary/80 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground", className].filter(Boolean).join(" ")}
          {...props}
        >
          {children}
        </code>
      )
    },
    blockquote: ({ className, children, ...props }) => {
      const childArray = Children.toArray(children)
      const firstChild = childArray[0]

      if (isValidElement(firstChild) && firstChild.type === "p") {
        const firstText = getTextContent(firstChild.props.children).trim()
        const calloutMatch = splitCalloutText(firstText)

        if (calloutMatch) {
          const { type, fold, title: rawTitle, remainder } = calloutMatch
          const { shell, badge } = resolveCalloutClasses(type)
          const title = rawTitle || formatCalloutLabel(type)
          const content = childArray.slice(1)
          const body = (
            <>
              {remainder ? <p>{remainder}</p> : null}
              {content}
            </>
          )

          if (fold !== "static") {
            return (
              <details
                className={["mt-6 rounded-[1.75rem] border px-5 py-4 shadow-sm", shell, className].filter(Boolean).join(" ")}
                open={fold === "expanded"}
                {...props}
              >
                <summary className="flex cursor-pointer list-none items-center gap-3">
                  <span className={["rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]", badge].filter(Boolean).join(" ")}>
                    {formatCalloutLabel(type)}
                  </span>
                  <span className="text-sm font-medium text-current">{title}</span>
                </summary>
                {remainder || content.length > 0 ? <div className="mt-3 space-y-3 text-sm leading-7 text-current/90">{body}</div> : null}
              </details>
            )
          }

          return (
            <div className={["mt-6 rounded-[1.75rem] border px-5 py-4 shadow-sm", shell, className].filter(Boolean).join(" ")} {...props}>
              <div className="flex items-center gap-3">
                <span className={["rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]", badge].filter(Boolean).join(" ")}>
                  {formatCalloutLabel(type)}
                </span>
                <p className="text-sm font-medium text-current">{title}</p>
              </div>
              {remainder || content.length > 0 ? (
                <div className="mt-3 space-y-3 text-sm leading-7 text-current/90">{body}</div>
              ) : null}
            </div>
          )
        }
      }

      return (
        <blockquote
          className={["mt-6 rounded-[1.5rem] border border-border/70 bg-secondary/70 px-5 py-4 text-sm leading-7 text-muted-foreground", className]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {children}
        </blockquote>
      )
    },
    ...components,
  }
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return createMDXComponents(components)
}

export function getMDXComponents(components: MDXComponents = {}): MDXComponents {
  return createMDXComponents(components)
}
