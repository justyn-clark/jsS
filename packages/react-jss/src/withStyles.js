// @flow
import * as React from 'react'
import {type StyleSheet, type Classes} from 'jss'
import {ThemeContext} from 'theming'

import type {HOCProps, HookOptions, HOCOptions, Styles, InnerProps, DynamicRules} from './types'
import getDisplayName from './getDisplayName'
import memoize from './utils/memoizeOne'
import mergeClasses from './utils/mergeClasses'
import getSheetIndex from './utils/getSheetIndex'
import createUseStyles from './createUseStyles'

interface State {
  dynamicRules: ?DynamicRules;
  sheet: ?StyleSheet;
  classes: {};
}

const NoRenderer = (props: {children?: React.Node}) => props.children || null

const noTheme = {}

type CreateWithStyles = <Theme>(
  Styles<Theme>,
  HOCOptions<Theme> | void
) => <Props: InnerProps>(React.ComponentType<Props>) => React.ComponentType<Props>

/**
 * HOC creator function that wrapps the user component.
 *
 * `withStyles(styles, [options])(Component)`
 */
const createWithStyles: CreateWithStyles = <Theme>(styles, options = {}) => {
  const {index = getSheetIndex(), theming, injectTheme, ...sheetOptions} = options
  const CurrentTheme = theming || ThemeContext

  return <Props: InnerProps>(InnerComponent = NoRenderer) => {
    const displayName = getDisplayName(InnerComponent)

    const mergeClassesProp = memoize(
      (sheetClasses, classesProp): Classes =>
        classesProp ? mergeClasses(sheetClasses, classesProp) : sheetClasses
    )

    const WithStyles = React.forwardRef((props, ref) => {
      const theme = React.useContext(CurrentTheme)

      const useStyle = React.useMemo(
        () =>
          createUseStyles(styles, {
            theme,
            index,
            name: displayName,
            ...sheetOptions
          }),
        [styles, theme, index, displayName, sheetOptions]
      )

      const sheetClasses = useStyle(props)

      const {classes, ...rest} = props
      const newProps = {
        ...rest,
        classes: mergeClassesProp(sheetClasses, classes)
      }

      if (ref) newProps.ref = ref
      if (injectTheme) newProps.theme = theme

      return <InnerComponent {...newProps} />
    })

    WithStyles.displayName = `WithStyles(${displayName})`
    WithStyles.defaultProps = {...InnerComponent.defaultProps}

    WithStyles.InnerComponent = InnerComponent

    return WithStyles
  }
}

export default createWithStyles
