var displays = require('./displays'),
    wiki = require('../wiki'),
    lib = require('../lib');

function getCoords(inp) {
    return {x: 10 *  inp.ec,
            y: 10 * -inp.soc };
}

function out(getData, res) {

    getData(function (err, data) {
        var params = {layout: false};

        // map ranges
        params.ranges = lib.mapValues({80: null, 90: null}, function (range) {
            return displays.getRange(lib.pluck(data, 'compass'), range);
        });

        params.compasses = lib.map(data, function (compass) {
            return {
                name: compass.name,
                compass: compass.compass,
                url: wiki.getUserPageURL(compass.name),
                coords: getCoords(compass.compass)
            };
        });

        res.contentType('image/svg+xml');
        res.render('graph.svg.jade', params);
    /*
        ?>
        </g>
        <?php
            # Durchschnitt
            $no = count($this->compass_data);
            list($x, $y) = $this->_get_cords($this->sum['pc_soc'] / $no, $this->sum['pc_ec'] / $no);
            echo "\n".'<line style="fill:none; stroke:#ffff00" x1="'.($x-5).'" y1="'.($y-5).'" x2="'.($x+5).'" y2="'.($y+5).'" />';
            echo "\n".'<line style="fill:none; stroke:#ffff00" x1="'.($x-5).'" y1="'.($y+5).'" x2="'.($x+5).'" y2="'.($y-5).'" />';
            echo "\n</svg>";
    */
    });
}

exports.out = out;
