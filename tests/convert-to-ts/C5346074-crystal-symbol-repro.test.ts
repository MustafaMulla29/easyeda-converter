import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { EasyEdaJsonSchema } from "lib/schemas/easy-eda-json-schema"
import { convertBetterEasyToTsx } from "lib/websafe/convert-to-typescript-component"
import { runTscircuitCode } from "tscircuit"
import crystalRawEasy from "../assets/C5346074.raweasy.json"
import fourPinCrystalRawEasy from "../assets/C284163.raweasy.json"

test("repro: C5346074 imports as a generic chip component", async () => {
  const betterEasy = EasyEdaJsonSchema.parse(crystalRawEasy)
  const result = await convertBetterEasyToTsx({ betterEasy })
  const fourPinBetterEasy = EasyEdaJsonSchema.parse(fourPinCrystalRawEasy)
  const fourPinResult = await convertBetterEasyToTsx({
    betterEasy: fourPinBetterEasy,
  })

  expect(result).toContain("<chip")
  expect(result).toContain("symbol={")
  expect(fourPinResult).toContain("<crystal")
  expect(fourPinResult).toContain('pinVariant="four_pin"')

  const componentName = result.match(/export const (\w+)/)?.[1]
  const fourPinComponentName = fourPinResult.match(/export const (\w+)/)?.[1]
  expect(componentName).toBeDefined()
  expect(fourPinComponentName).toBeDefined()

  const circuitJson = await runTscircuitCode(`
    ${result}
    ${fourPinResult}
    export default () => (
      <board>
        <${componentName} name="X1" schX={-1} loadCapacitance="10pF" />
        <${fourPinComponentName} name="X2" schX={1} loadCapacitance="12pF" />
      </board>
    )
  `)

  expect(convertCircuitJsonToSchematicSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
    "C5346074-crystal-symbol-repro",
  )
})
