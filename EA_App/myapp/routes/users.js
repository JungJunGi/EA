var express = require('express');
var router = express.Router();

var data ={
  "data":[
      {
          "contract_demand": 1200,
          "load":"경부하",
          "electric_power":50000
      },
      {
          "contract_demand": 1200,
          "load":"중간부하",
          "electric_power":350000
      },
      {
          "contract_demand": 1200,
          "load":"최대부하",
          "electric_power":30000
      }
  ]
};

/* GET users listing. */
router.get('/money', function(req, res, next) {
  return res.json(data);
});

module.exports = router;
