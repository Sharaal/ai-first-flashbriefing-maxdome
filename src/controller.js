const _ = {
  sample: require('lodash.sample'),
};
const renderer = require('@ai-first/renderer-maxdome');
const { Review } = require('@dnode/request-maxdome');

module.exports = ({ maxdome, redisClient }) => [
  'get',
  [
    '/',
    async (req, res) => {
      let flashbriefing;
      try {
        const page = await maxdome.get('v1/pages/%2F', {
          headers: {
            client: 'mxd_package',
            clienttype: 'ott',
            platform: 'ott.v2',
          },
        });
        const componentId = page.components.container.filter(
          component =>
          component.container[0].headline === 'Empfehlungen unserer Redaktion'
        )[0].container[0].meta_id;
        const component = await maxdome.get(`v1/components/${componentId}`, {
          headers: {
            client: 'mxd_package',
          },
        });
        const review = new Review(_.sample(component.reviews.slice(0, 3)));
        const asset = review.asset;
        flashbriefing = {
          uid: asset.link,
          updateDate: new Date().toISOString(),
          titleText: renderer({ review }, ['tipOfTheDay', 'typedTitle']),
          mainText: renderer({ review }, [
            'tipOfTheDay',
            'maxpert',
            'typedTitle',
            'review',
          ]),
          redirectionUrl: asset.link,
        };
        await redisClient.setJSON('FLASHBRIEFING', flashbriefing);
      } catch (e) {
        flashbriefing = await redisClient.getJSON('FLASHBRIEFING');
        if (!flashbriefing) {
          throw Error('heimdall not available and cache is empty');
        }
      }
      res.send(flashbriefing);
    },
  ],
];
