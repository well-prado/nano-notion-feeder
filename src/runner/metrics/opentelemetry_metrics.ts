import { DefaultLogger } from "@nanoservice-ts/runner";
import { metrics } from "@opentelemetry/api";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { Resource } from "@opentelemetry/resources";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";

// Set up the Prometheus exporter to expose metrics at /metrics on port 9091
const prometheusExporter = new PrometheusExporter({}, () =>
	new DefaultLogger().log("Metrics endpoint: http://localhost:4000/metrics"),
);

const resource = Resource.default().merge(
	new Resource({
		[ATTR_SERVICE_NAME]: "trigger-http",
		[ATTR_SERVICE_VERSION]: "0.0.8",
	}),
);

// Creates MeterProvider and installs the exporter as a MetricReader
const meterProvider = new MeterProvider({
	resource: resource,
});
meterProvider.addMetricReader(prometheusExporter);

metrics.setGlobalMeterProvider(meterProvider);

const meter = metrics.getMeter("default");
const metricsHandler = prometheusExporter.getMetricsRequestHandler.bind(prometheusExporter);

export { meter, metricsHandler };
