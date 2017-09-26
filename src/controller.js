const _ = {
  sample: require('lodash.sample'),
};
const renderer = require('@ai-first/renderer-maxdome');
const { Asset } = require('@dnode/request-maxdome');

let flashbriefing;

module.exports = ({ logger, maxdome }) => [
  'get',
  [
    '/',
    async (req, res) => {
      try {
        const page = await maxdome.get('v1/pages/%2Fhome', {
          headers: {
            client: 'mxd_package',
            clienttype: 'hitachi_vestel_tv_smooth',
            platform: 'ott_lighthouse.v2',
          },
        });
        const componentId = page.components.container[0].container[0].meta_id;
        const component = await maxdome.get(`v1/components/${componentId}`, {
          headers: {
            client: 'mxd_package',
          },
        });
        const asset = new Asset(component.mam_asset_ids[0]);
        flashbriefing = {
          uid: asset.link,
          updateDate: new Date().toISOString(),
          titleText: renderer({ asset }, ['tipOfTheDay', 'typedTitle']),
          mainText: renderer({ asset }, [
            'tipOfTheDay',
            'typedTitle',
            'description',
          ]),
          redirectionUrl: asset.link,
        };
      } catch (e) {
        logger.error(e.message);
        if (!flashbriefing) {
          throw Error('heimdall not available and cache is empty');
        }
      }
      res.send(flashbriefing);
    },
  ],
];
