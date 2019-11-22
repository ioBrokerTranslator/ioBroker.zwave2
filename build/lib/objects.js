"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strings_1 = require("alcalzone-shared/strings");
const global_1 = require("./global");
/** Converts a device label to a valid filename */
function nameToStateId(label) {
    const safeName = label
        // Remove trailing, leading and multiple whitespace
        .trim()
        .replace(/\s+/g, " ")
        // Replace all unsafe chars
        .replace(/[^a-zA-Z0-9\-_ ]+/g, "_")
        // Replace spaces surrounded by unsafe chars with a space
        .replace(/_\s/g, " ")
        .replace(/\s_/g, " ")
        // Remove trailing and leading underscores
        .replace(/^_\s*/, "")
        .replace(/\s*_$/, "");
    return camelCase(safeName);
}
function camelCase(str) {
    return str
        .split(" ")
        .map((substr, i) => i === 0
        ? substr.toLowerCase()
        : substr[0].toUpperCase() + substr.slice(1).toLowerCase())
        .join("");
}
function computeId(nodeId, args) {
    var _a, _b;
    return [
        `Node_${strings_1.padStart(nodeId.toString(), 3, "0")}`,
        args.commandClassName.replace(/[\s]+/g, "_"),
        [
            ((_a = args.propertyName) === null || _a === void 0 ? void 0 : _a.trim()) && nameToStateId(args.propertyName),
            args.endpoint && strings_1.padStart(args.endpoint.toString(), 3, "0"),
            ((_b = args.propertyKeyName) === null || _b === void 0 ? void 0 : _b.trim()) && nameToStateId(args.propertyKeyName),
        ]
            .filter(s => !!s)
            .join("_"),
    ].join(".");
}
exports.computeId = computeId;
async function extendValue(node, args) {
    const stateId = computeId(node.id, args);
    await extendMetadata(node, args);
    await global_1.Global.adapter.setStateAsync(stateId, args.newValue, true);
}
exports.extendValue = extendValue;
async function extendMetadata(node, args) {
    const stateId = computeId(node.id, args);
    const metadata = ("metadata" in args && args.metadata) || node.getValueMetadata(args);
    const objectDefinition = {
        type: "state",
        common: {
            role: "value",
            read: metadata.readable,
            write: metadata.writeable,
            name: metadata.label
                ? `${metadata.label}${args.endpoint ? ` (Endpoint ${args.endpoint})` : ""}`
                : stateId,
            desc: metadata.description,
            type: valueTypeToIOBrokerType(metadata.type),
            min: metadata.min,
            max: metadata.max,
            def: metadata.default,
            unit: metadata.unit,
            states: metadata.states,
        },
        native: {
            nodeId: node.id,
            valueId: {
                commandClass: args.commandClass,
                endpoint: args.endpoint,
                property: args.property,
                propertyKey: args.propertyKey,
            },
            steps: metadata.steps,
        },
    };
    // FIXME: Only set the object when it changed
    await global_1.Global.adapter.setObjectAsync(stateId, objectDefinition);
}
exports.extendMetadata = extendMetadata;
async function removeValue(nodeId, args) {
    const stateId = computeId(nodeId, args);
    await global_1.Global.adapter.delObjectAsync(stateId);
}
exports.removeValue = removeValue;
function valueTypeToIOBrokerType(valueType) {
    switch (valueType) {
        case "number":
        case "boolean":
        case "string":
            return valueType;
        case "any":
            return "mixed";
        default:
            if (valueType.endsWith("[]"))
                return "array";
    }
    return "mixed";
}
//# sourceMappingURL=objects.js.map