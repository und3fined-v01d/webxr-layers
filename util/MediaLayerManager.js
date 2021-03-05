class MediaLayerManager {
    constructor(session) {
        this.session = session;
        this.mediaFactory = this.createMediaFactory();
    }

    static get QUAD_LAYER() {
        return "QUAD_LAYER";
    }

    static get EQUIRECT_LAYER() {
        return "EQUIRECT_LAYER";
    }

    /**
     * Create a media factory used to create layers
     */
    createMediaFactory() {
        const mediaFactory = new XRMediaBinding(this.session);
        return mediaFactory;
    }

    /**
     *
     * @param {Object} refSpace XRReferenceSpace object
     * @param {string} layerType One of "QUAD_LAYER", "EQUIRECT_LAYER"
     * @param {Object} options Options to initialize layer created
     */
    async createLayer(video, layerType, options) {
        // Check if layerType is valid
        if (
            layerType !== this.QUAD_LAYER &&
            layerType !== this.EQUIRECT_LAYER
        ) {
            throw new Error(
                `Invalid layer type: layer type must be one of "QUAD_LAYER" || "EQUIRECT_LAYER"`
            );
        } else {
            let layer;

            // Get reference space from the session
            const refSpace = await this.session.requestReferenceSpace("local");

            // Create a layer based on the layer type
            switch (layerType) {
                case "QUAD_LAYER":
                    layer = this.mediaFactory.createQuadLayer(video, {
                        space: refSpace,
                        ...options,
                    });
                    break;
                case "EQUIRECT_LAYER":
                    layer = this.mediaFactory.createEquirectLayer(video, {
                        space: refSpace,
                        ...options,
                    });
                    break;
            }

            return layer;
        }
    }
}

export default MediaLayerManager;