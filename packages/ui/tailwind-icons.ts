import { getIconsCSSData } from '@iconify/utils/lib/css/icons'
import { icons as prime } from '@iconify-json/prime'
import { icons as tabler } from '@iconify-json/tabler'
import plugin from 'tailwindcss/plugin'

import type { IconifyJSON } from '@iconify-json/tabler'


// Tabler's default stroke is heavier than that of PrimeIcons, which PrimeReact's components use
const TABLER_STROKE_WIDTH = 1.5

const withStrokeWidth = (iconSet: IconifyJSON, strokeWidth: number): IconifyJSON => ({
  ...iconSet,
  icons: Object.fromEntries(Object.entries(iconSet.icons).map(([name, icon]) => [
    name,
    { ...icon, body: icon.body.replaceAll('stroke-width="2"', `stroke-width="${strokeWidth}"`) },
  ])),
})

const iconSets: Partial<Record<string, IconifyJSON>> = {
  prime,
  tabler: withStrokeWidth(tabler, TABLER_STROKE_WIDTH),
}

const reported = new Set<string>()

// icons as classes, `icon-[tabler--home]`: masks in the text color, 1em in size; like any utility, only the icons
// in use end up in the stylesheet
const tailwindIcons = plugin(api => {
  api.matchComponents({
    icon: value => {
      const [prefix, name] = value.split('--')
      const iconSet = iconSets[prefix]
      const data = iconSet && name ? getIconsCSSData(iconSet, [name], { iconSelector: '.icon', mode: 'mask' }) : null
      const icon = data?.css.at(0)
      if (!data?.common || !icon) {
        if (!reported.has(value)) {
          reported.add(value)
          process.stderr.write(`Unknown icon "${value}", the icon sets are: ${Object.keys(iconSets).join(', ')}\n`)
        }
        return {}
      }
      return { ...data.common.rules, ...icon.rules }
    },
  })
})

export default tailwindIcons
