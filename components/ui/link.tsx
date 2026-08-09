"use client"

import * as React from "react"
import { Link as QuillLink, type LinkProps as QuillLinkProps } from "@deriv-com/quill-ui-v2"

export type LinkProps = QuillLinkProps

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => (
  <QuillLink ref={ref} {...props} />
))
Link.displayName = "Link"

export { Link }
