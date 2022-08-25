<?php
$document = $_GET['iiif'];
$page = $_GET['page'];
$viewerid = md5(rand());
?>
<!DOCTYPE html>
<html>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<head>
<script src="js/openseadragon/openseadragon-fabricadapted-v2.4.2.js" type="text/javascript"></script>
<script src="js/jquery.js" type="text/javascript"></script>
</head>
<body>
<div style="width: 100%; height: 500px; min-height: 100%;" id="<?php echo $viewerid; ?>"></div>

<script>
new Promise((resolve, reject) => {
            jQuery.getJSON("<?php echo $document; ?>").then(data => {
                resolve(OpenSeadragon({
                            id: "<?php echo $viewerid; ?>",
                            prefixUrl: "js/demiscript/images/",
                            allowZoomToConstraintsOnResize: true,
                            showNavigator:  true,
                            tileSources: data.sequences[0].canvases[<?php echo ($page - 1); ?>].images[0].resource.service['@id'] + "/info.json",
                            maxZoomLevel: 30,
                            minZoomLevel: 1,
                            showRotationControl: true
                          }));
}, error => {
  reject(console.log("failed to load tile sources"));
});
});

</script>
</body>
</html>
