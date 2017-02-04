/**
 * Created by sse316 on 7/9/2016.
 */


/**
 * Created by huyonghao on 16/6/15.
 */

$(function(){


    var isShowTriggerArea = true;


    var triggerBoxs = [];
    var wallBoxs = [];
    var isJumpArea = true;

    var cameraX,cameraY,cameraZ;

    var stats = initStats();

    var workerLoadVsg=new Worker("js/loadBlockVsg.js");
    var workerDout=new Worker("js/loadMergedFile.js");
    var workerBasic=new Worker("js/loadModelInfo.js");
    var currentBlcokName = "W";
    var preBlockName = "W";


    var isFirstLoad = true;

    /***
     * 场景配置参数
     */
    var VoxelSize = 2.24103;
    var SceneBBoxMinX = -320.718;
    var SceneBBoxMinY = -202.163;
    var SceneBBoxMinZ = -21.6323;

    var renderer = new THREE.WebGLRenderer({antialias:true});
    $("#WebGL-output").append(renderer.domElement);
    //renderer.setClearColorHex(0xEEEEEE);
    renderer.setSize(window.innerWidth-200, window.innerHeight-3);

    var scene=new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, (window.innerWidth-200) / window.innerHeight, 0.1, 2000);


    camera.position.x = 34;
    camera.position.y = -1;
    camera.position.z = 67;

    workerLoadVsg.postMessage(currentBlcokName);

    //camera.position.x = -150;
    //camera.position.y = 6;
    //camera.position.z = 136;

    //var myGeometry = new THREE.Geometry();
    //var movingCubeSize = 20;
    //myGeometry.vertices.push(
    //    new THREE.Vector3(0,0,-1*movingCubeSize)
    //);
    //var wireMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe:true } );
    //var MovingCube = new THREE.Mesh( myGeometry, wireMaterial );
    //camera.add( MovingCube );

    var clock = new THREE.Clock();
    var camControls = new THREE.MyFPC(camera,renderer.domElement);

    camControls.lookSpeed = 0.8;
    camControls.movementSpeed = 5 * 1.5;
    camControls.noFly = true;
    camControls.lookVertical = true;
    camControls.constrainVertical = true;
    camControls.verticalMin = 1.0;
    camControls.verticalMax = 2.0;
    //camControls.lon = 220;      //经度
    //camControls.lat = -30;        //纬度

    var imagePrefix = "assets/skybox/sky_";
    var directions  = ["negX", "posX", "posY", "negY", "posZ", "negZ"];
    var imageSuffix = ".png";
    var skyGeometry = new THREE.CubeGeometry( 1000, 1000, 1000 );

    var materialArray = [];
    for (var i = 0; i < 6; i++)
        materialArray.push( new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
            side: THREE.BackSide
        }));
    var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
    var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
    scene.add( skyBox );




    var ambientLight = new THREE.AmbientLight(0xcccccc);
    scene.add(ambientLight);


    var directionLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    directionLight.position.set( 0, 1, -1 );
    scene.add( directionLight );


    //var vec = MovingCube.geometry.vertices[0].clone();
    //vec = MovingCube.localToWorld(vec);
    var lables = new function(){
        this.CameraPosition = "0,0,0";
        this.cameraY = camera.position.y;
        this.cameraZ = camera.position.z;
        this.cameraTongX = Math.round((camera.position.x - (-322.959) )/2.31483);
        this.cameraTongZ = Math.round((camera.position.z - (-205.87 ) )/2.31483);
        this.cameraTongY = Math.round((camera.position.y - (-25.4188 ) )/2.31483);
        this.pointX = camControls.targetObject.position.x;
        this.pointY = camControls.targetObject.position.y;
        this.pointZ = currentBlcokName;
    }

    var gui = new dat.GUI();
    gui.domElement.id = 'gui';
    gui.add(lables,'CameraPosition').listen();
    //gui.add(lables,'cameraY').listen();
    //gui.add(lables,'cameraZ').listen();
    //gui.add(lables,'cameraTongX').listen();
    //gui.add(lables,'cameraTongY').listen();
    //gui.add(lables,'cameraTongZ').listen();
    //gui.add(lables,'pointX').listen();
    //gui.add(lables,'pointY').listen();
    //gui.add(lables,'pointZ').listen();



    var modelDataV = [];
    var modelDataT = [];
    var modelDataF = [];
    var modelDataM = [];
    var modelDataNewN = [];
    var basicFileArr = [];
    var vsgData = [],vsgArr=[];
    var outsideSourcesFileCount = 0, basicFileCount = 0;
    var sendMessageGroupLength = 2000;
    var outsideIfcColumnNameArr = [];
    var outsideIfcColumnModel = [];
    var isStartListenIfcColumn = false;
    var sendMessageMaxSize = 1400;
    var isGetBigFiles = false;
    var triggerAreaMap = [];
    var wallArr = [];

    var IfcFootingGeo = new THREE.Geometry(),
        IfcWallStandardCaseGeo = new THREE.Geometry(),
        IfcSlabGeo = new THREE.Geometry(),
        IfcStairGeo = new THREE.Geometry(),
        IfcDoorGeo = new THREE.Geometry(),
        IfcWindowGeo = new THREE.Geometry(),
        IfcBeamGeo = new THREE.Geometry(),
        IfcCoveringGeo = new THREE.Geometry(),
        IfcFlowSegmentGeo = new THREE.Geometry(),
        IfcWallGeo = new THREE.Geometry(),
        IfcRampGeo = new THREE.Geometry(),
        IfcRailingGeo = new THREE.Geometry(),
        IfcFlowTerminalGeo = new THREE.Geometry(),
        IfcBuildingElementProxyGeo  = new THREE.Geometry(),
        IfcColumnGeo = new THREE.Geometry(),
        IfcFlowControllerGeo = new THREE.Geometry(),
        IfcFlowFittingGeo = new THREE.Geometry();

    function initValue()
    {
        modelDataV = [];
        modelDataT = [];
        modelDataF = [];
        modelDataM = [];
        modelDataNewN = [];
        vsgData = [];
        vsgArr=[];
        outsideSourcesFileCount = 0;
        sendMessageGroupLength = 2000;
        outsideIfcColumnNameArr = [];
        outsideIfcColumnModel = [];
        isStartListenIfcColumn = false;
        isGetBigFiles = false;
        IfcFootingGeo = new THREE.Geometry();
        IfcWallStandardCaseGeo = new THREE.Geometry();
        IfcSlabGeo = new THREE.Geometry();
        IfcStairGeo = new THREE.Geometry();
        IfcDoorGeo = new THREE.Geometry();
        IfcWindowGeo = new THREE.Geometry();
        IfcBeamGeo = new THREE.Geometry();
        IfcCoveringGeo = new THREE.Geometry();
        IfcFlowSegmentGeo = new THREE.Geometry();
        IfcWallGeo = new THREE.Geometry();
        IfcRampGeo = new THREE.Geometry();
        IfcRailingGeo = new THREE.Geometry();
        IfcFlowTerminalGeo = new THREE.Geometry();
        IfcBuildingElementProxyGeo  = new THREE.Geometry();
        IfcColumnGeo = new THREE.Geometry();
        IfcFlowControllerGeo = new THREE.Geometry();
        IfcFlowFittingGeo = new THREE.Geometry();
    }



    var isOnload = true; //判断是否在加载，如果在加载，render停掉

    var cashVoxelSize;
    var cashSceneBBoxMinX;
    var cashSceneBBoxMinY;
    var cashSceneBBoxMinZ;
    var cashtriggerAreaMap;
    var cashWallArr;

    workerLoadVsg.onmessage=function(event) {
        isOnload = true;
        //弹出窗口
        $("#progress").css({"display":"block"});

        setTimeout(function(){
            $("#progress").addClass("in")

        },10)
        $("body,html").css({"overflow":"hidden"})

        initValue();
        vsgData = event.data.vsgMap;
        cashVoxelSize = event.data.voxelSize;
        cashSceneBBoxMinX = event.data.sceneBBoxMinX;
        cashSceneBBoxMinY = event.data.sceneBBoxMinY;
        cashSceneBBoxMinZ = event.data.sceneBBoxMinZ;
        //需要获取到触发区域的值
        cashtriggerAreaMap = event.data.structureInfo;
        cashWallArr = event.data.wallInfoArr;

        if(isJumpArea)
        {
            isJumpArea = false;
            camera.position.x = event.data.originPos[0];
            camera.position.y = event.data.originPos[1];
            camera.position.z = event.data.originPos[2];
            camControls.targetObject.position.x = event.data.originPos[0];
            camControls.targetObject.position.y = event.data.originPos[1];
            camControls.targetObject.position.z = event.data.originPos[2];
            camControls.lon = event.data.originPos[3];
            camControls.lat = event.data.originPos[4];
        }

        var datNum = event.data.datNum;

        if(isFirstLoad)
        {
            isFirstLoad = false;
            TranslateGroup();
        }


        document.getElementById('progressLable').innerHTML = "连接到服务器...";


        SendMessagetoWorkDforOutsideModel(datNum);
    }

    function SendMessagetoWorkDforOutsideModel(datNum)
    {
        for(var key in vsgData)
        {
            for(var i=0;i<vsgData[key].length;i++)
            {
                if(vsgArr.indexOf(vsgData[key][i])==-1)
                {
                    vsgArr.push(vsgData[key][i]);
                }
            }
        }
        console.log("vsgArr length is:"+vsgArr.length);

        for(var i=0;i<=datNum;i++)
        {
            workerDout.postMessage(currentBlcokName+"_"+i);
        }




    }

    workerDout.onmessage = function (event) {
        var Data=event.data;
        if(Data.newFileName)
        {
            var tempKeyValue = Data.nam;
            if(!modelDataNewN[tempKeyValue])
            {
                modelDataNewN[tempKeyValue] = [];
            }
            if(!modelDataM[tempKeyValue])
            {
                modelDataM[tempKeyValue] = [];
            }
            modelDataNewN[tempKeyValue] = Data.newFileName;
            modelDataM[tempKeyValue] = Data.m;
        }
        else{
            var tempKeyValue = Data.nam;
            if(!modelDataV[tempKeyValue])
            {
                modelDataV[tempKeyValue] = [];
            }
            if(!modelDataT[tempKeyValue])
            {
                modelDataT[tempKeyValue] = [];
            }
            if(!modelDataF[tempKeyValue])
            {
                modelDataF[tempKeyValue] = [];
            }
            for(var dataCount = 0; dataCount<Data.v.length;dataCount++)
            {
                modelDataV[tempKeyValue].push(Data.v[dataCount]);
                modelDataT[tempKeyValue].push(Data.t[dataCount]);
                modelDataF[tempKeyValue].push(Data.f[dataCount]);
            }
        }
        Data = null;
        outsideSourcesFileCount++;

        //修改HTML标签内容
        var progress = Math.floor(100*outsideSourcesFileCount/vsgArr.length);
        document.getElementById('progressLable').innerHTML = progress + "%";

        //if(outsideSourcesFileCount == sendMessageMaxSize && isGetBigFiles)
        //{
        //    for(var i=sendMessageMaxSize;i<vsgArr.length;i++)
        //    {
        //        workerDout.postMessage(vsgArr[i]);
        //    }
        //}
        if(outsideSourcesFileCount==vsgArr.length)
        {
            //修改HTML标签内容
            document.getElementById('progressLable').innerHTML = "生成模型";
            for(var i=0; i<vsgArr.length; i++) {
                var tempFileName = vsgArr[i];
                if (modelDataNewN[tempFileName]) {
                    var newName = modelDataNewN[tempFileName];
                    if (!modelDataV[newName]) {
                        if(basicFileArr.indexOf(newName)==-1)
                        {
                            basicFileArr.push(newName);
                        }
                    }
                }
            }
            console.log("basic file length: " +basicFileArr.length);
            if(basicFileArr.length==0)
            {
                DrawModel();

                //加载完成
                isOnload = false;

                $("#progress").removeClass("in")
                setTimeout(function(){
                    $("#progress").css("display","none");

                },20)
                $("body,html").css({"overflow":"auto"})
            }
            else
            {
                basicFileCount=0;
                for(var i=0;i<basicFileArr.length;i++)
                {
                    workerBasic.postMessage(basicFileArr[i]);
                }
            }

        }
    }

    workerBasic.onmessage = function (event) {
        var Data = event.data;
        var tempKeyValue = Data.nam;
        if (!modelDataV[tempKeyValue]) {
            modelDataV[tempKeyValue] = [];
        }
        if (!modelDataT[tempKeyValue]) {
            modelDataT[tempKeyValue] = [];
        }
        if (!modelDataF[tempKeyValue]) {
            modelDataF[tempKeyValue] = [];
        }
        for (var dataCount = 0; dataCount < Data.v.length; dataCount++) {
            modelDataV[tempKeyValue].push(Data.v[dataCount]);
            modelDataT[tempKeyValue].push(Data.t[dataCount]);
            modelDataF[tempKeyValue].push(Data.f[dataCount]);
        }
        Data = null;
        basicFileCount++;
        if(basicFileCount==basicFileArr.length)
        {
            basicFileCount=0;
            basicFileArr=[];

            DrawModel();

            //加载完成
            isOnload = false;

            $("#progress").removeClass("in")
            setTimeout(function(){
                $("#progress").css("display","none");

            },20)
            $("body,html").css({"overflow":"auto"})
        }

    }


    var downArr = [],forArr = [];

    function DrawModel()
    {
        downArr = [];
        forArr = [];

        document.getElementById('progressLable').innerHTML = "正在绘制";
        for(var i=0; i<vsgArr.length; i++)
        {
            var tempFileName = vsgArr[i];

            if(tempFileName!=null)
            {
                if (modelDataNewN[tempFileName]) {

                    var newName = modelDataNewN[tempFileName];
                    var matrix = modelDataM[tempFileName];
//                            处理V矩阵，变形
                    if(modelDataV[newName])
                    {
                        modelDataV[tempFileName] = [];
                        for(var dataCount=0;dataCount<modelDataV[newName].length;dataCount++)
                        {
                            var vMetrix = [];
                            var tMetrix = [];
                            //var vArrary = [];
                            for (var j = 0; j < modelDataV[newName][dataCount].length; j += 3) {
                                var newN1 = modelDataV[newName][dataCount][j] * matrix[0] + modelDataV[newName][dataCount][j + 1] * matrix[4] + modelDataV[newName][dataCount][j + 2] * matrix[8] + 1.0 * matrix[12];
                                var newN2 = modelDataV[newName][dataCount][j] * matrix[1] + modelDataV[newName][dataCount][j + 1] * matrix[5] + modelDataV[newName][dataCount][j + 2] * matrix[9] + 1.0 * matrix[13];
                                var newN3 = modelDataV[newName][dataCount][j] * matrix[2] + modelDataV[newName][dataCount][j + 1] * matrix[6] + modelDataV[newName][dataCount][j + 2] * matrix[10]+ 1.0 * matrix[14];
                                var groupV = new THREE.Vector3(newN1, newN3, newN2);
                                vMetrix.push(groupV);
                                //vArrary.push(newN1);
                                //vArrary.push(newN2);
                                //vArrary.push(newN3);
                            }
                            //modelDataV[tempFileName].push(vArrary);
                            //处理T矩阵
                            for (var m = 0; m < modelDataT[newName][dataCount].length; m += 3) {
                                var newT1 = 1.0 * modelDataT[newName][dataCount][m];
                                var newT2 = 1.0 * modelDataT[newName][dataCount][m + 1];
                                var newT3 = 1.0 * modelDataT[newName][dataCount][m + 2];
                                //var newF1 = 1.0 * modelDataF[newName][dataCount][m] * matrix[0] + modelDataF[newName][dataCount][m + 1] * matrix[4] + modelDataF[newName][dataCount][m + 2] * matrix[8] + 1.0 * matrix[12];
                                //var newF2 = 1.0 * modelDataF[newName][dataCount][m] * matrix[1] + modelDataF[newName][dataCount][m + 1] * matrix[5] + modelDataF[newName][dataCount][m + 2] * matrix[9] + 1.0 * matrix[13];
                                //var newF3 = 1.0 * modelDataF[newName][dataCount][m] * matrix[2] + modelDataF[newName][dataCount][m + 1] * matrix[6] + modelDataF[newName][dataCount][m + 2] * matrix[10]+ 1.0 * matrix[14];
                                var newF1 = 1.0 * modelDataF[newName][dataCount][m];
                                var newF2 = 1.0 * modelDataF[newName][dataCount][m + 1];
                                var newF3 = 1.0 * modelDataF[newName][dataCount][m + 2];
                                var norRow = new THREE.Vector3(newF1, newF2, newF3);
                                var grouT = new THREE.Face3(newT1, newT2, newT3);
                                grouT.normal = norRow;
                                tMetrix.push(grouT);
                            }
                            //绘制
                            var geometry = new THREE.Geometry();
                            geometry.vertices = vMetrix;
                            geometry.faces = tMetrix;
                            //var polyhedron = createMesh(geometry,currentBlcokName,tempFileName);
                            //scene.add(polyhedron);

                            var pos=tempFileName.indexOf("=");
                            var ind=tempFileName.substring(pos+1);
                            if(ind) {
                                switch (ind) {
                                    case"IfcFooting":
                                        IfcFootingGeo.merge(geometry);
                                        break;
                                    case "IfcWallStandardCase"://ok
                                        IfcWallStandardCaseGeo.merge(geometry);
                                        break;
                                    case "IfcSlab"://ok
                                        IfcSlabGeo.merge(geometry);
                                        break;
                                    case "IfcStair"://ok
                                        IfcStairGeo.merge(geometry);
                                        break;
                                    case "IfcDoor"://ok
                                        IfcDoorGeo.merge(geometry);
                                        break;
                                    case "IfcWindow":
                                        IfcWindowGeo.merge(geometry);
                                        break;
                                    case "IfcBeam"://ok
                                        IfcBeamGeo.merge(geometry);
                                        break;
                                    case "IfcCovering":
                                        IfcCoveringGeo.merge(geometry);
                                        break;
                                    case "IfcFlowSegment"://ok
                                        IfcFlowSegmentGeo.merge(geometry);
                                        break;
                                    case "IfcWall"://ok
                                        IfcWallGeo.merge(geometry);
                                        break;
                                    case "IfcRamp":
                                        IfcRampGeo.merge(geometry);
                                        break;
                                    case "IfcRailing"://ok
                                        IfcRailingGeo.merge(geometry);
                                        break;
                                    case "IfcFlowTerminal"://ok
                                        IfcFlowTerminalGeo.merge(geometry);
                                        break;
                                    case "IfcBuildingElementProxy"://ok
                                        IfcBuildingElementProxyGeo.merge(geometry);
                                        break;
                                    case "IfcColumn"://ok
                                        IfcColumnGeo.merge(geometry);
                                        break;
                                    case "IfcFlowController"://ok
                                        IfcFlowControllerGeo.merge(geometry);
                                        break;
                                    case "IfcFlowFitting"://ok
                                        IfcFlowFittingGeo.merge(geometry);
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }
                    else
                    {
                        console.log("找不到modelDataV中对应的newName: "+newName);
                    }
                }
                if (modelDataV[tempFileName] && !modelDataNewN[tempFileName]) {
                    for(var dataCount=0;dataCount<modelDataV[tempFileName].length;dataCount++)
                    {
                        var vMetrix = [];
                        var tMetrix = [];
                        //处理V矩阵，变形
                        for (var j = 0; j < modelDataV[tempFileName][dataCount].length; j += 3) {
                            var newn1 = 1.0 * modelDataV[tempFileName][dataCount][j];
                            var newn2 = 1.0 * modelDataV[tempFileName][dataCount][j + 1];
                            var newn3 = 1.0 * modelDataV[tempFileName][dataCount][j + 2];
                            var groupV = new THREE.Vector3(newn1, newn3, newn2);
                            vMetrix.push(groupV);
                        }
                        //处理T矩阵
                        for (var m = 0; m < modelDataT[tempFileName][dataCount].length; m += 3) {
                            var newT1 = 1.0 * modelDataT[tempFileName][dataCount][m];
                            var newT2 = 1.0 * modelDataT[tempFileName][dataCount][m + 1];
                            var newT3 = 1.0 * modelDataT[tempFileName][dataCount][m + 2];
                            var newF1 = 1.0 * modelDataF[tempFileName][dataCount][m];
                            var newF2 = 1.0 * modelDataF[tempFileName][dataCount][m + 1];
                            var newF3 = 1.0 * modelDataF[tempFileName][dataCount][m + 2];
                            var norRow = new THREE.Vector3(newF1, newF2, newF3);
                            var groupF = new THREE.Face3(newT1, newT2, newT3);
                            groupF.normal = norRow;
                            tMetrix.push(groupF);
                        }

                        //绘制
                        var geometry = new THREE.Geometry();
                        geometry.vertices = vMetrix;
                        geometry.faces = tMetrix;
                        //var polyhedron = createMesh(geometry,currentBlcokName,tempFileName);
                        //scene.add(polyhedron);
                        var pos=tempFileName.indexOf("=");
                        var ind=tempFileName.substring(pos+1);
                        if(ind) {
                            switch (ind) {
                                case"IfcFooting":
                                    IfcFootingGeo.merge(geometry);
                                    break;
                                case "IfcWallStandardCase"://ok
                                    IfcWallStandardCaseGeo.merge(geometry);
                                    break;
                                case "IfcSlab"://ok
                                    IfcSlabGeo.merge(geometry);
                                    break;
                                case "IfcStair"://ok
                                    IfcStairGeo.merge(geometry);
                                    break;
                                case "IfcDoor"://ok
                                    IfcDoorGeo.merge(geometry);
                                    break;
                                case "IfcWindow":
                                    IfcWindowGeo.merge(geometry);
                                    break;
                                case "IfcBeam"://ok
                                    IfcBeamGeo.merge(geometry);
                                    break;
                                case "IfcCovering":
                                    IfcCoveringGeo.merge(geometry);
                                    break;
                                case "IfcFlowSegment"://ok
                                    IfcFlowSegmentGeo.merge(geometry);
                                    break;
                                case "IfcWall"://ok
                                    IfcWallGeo.merge(geometry);
                                    break;
                                case "IfcRamp":
                                    IfcRampGeo.merge(geometry);
                                    break;
                                case "IfcRailing"://ok
                                    IfcRailingGeo.merge(geometry);
                                    break;
                                case "IfcFlowTerminal"://ok
                                    IfcFlowTerminalGeo.merge(geometry);
                                    break;
                                case "IfcBuildingElementProxy"://ok
                                    IfcBuildingElementProxyGeo.merge(geometry);
                                    break;
                                case "IfcColumn"://ok
                                    IfcColumnGeo.merge(geometry);
                                    break;
                                case "IfcFlowController"://ok
                                    IfcFlowControllerGeo.merge(geometry);
                                    break;
                                case "IfcFlowFitting"://ok
                                    IfcFlowFittingGeo.merge(geometry);
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            }
        }


        var polyhedron = createMesh(IfcFootingGeo,currentBlcokName,"IfcFooting");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcWallStandardCaseGeo,currentBlcokName,"IfcWallStandardCase");
        scene.add(polyhedron);
        forArr.push(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcSlabGeo,currentBlcokName,"IfcSlab");
        scene.add(polyhedron);
        downArr.push(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcStairGeo,currentBlcokName,"IfcStair");
        scene.add(polyhedron);
        downArr.push(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcDoorGeo,currentBlcokName,"IfcDoor");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcWindowGeo,currentBlcokName,"IfcWindow");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcBeamGeo,currentBlcokName,"IfcBeam");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcCoveringGeo,currentBlcokName,"IfcCovering");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcFlowSegmentGeo,currentBlcokName,"IfcFlowSegment");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcWallGeo,currentBlcokName,"IfcWall");
        scene.add(polyhedron);
        forArr.push(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcRampGeo,currentBlcokName,"IfcRamp");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcRailingGeo,currentBlcokName,"IfcRailing");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcFlowTerminalGeo,currentBlcokName,"IfcFlowTerminal");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcBuildingElementProxyGeo,currentBlcokName,"IfcBuildingElementProxy");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcColumnGeo,currentBlcokName,"IfcColumn");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcFlowControllerGeo,currentBlcokName,"IfcFlowController");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);

        var polyhedron = createMesh(IfcFlowFittingGeo,currentBlcokName,"IfcFlowFitting");
        scene.add(polyhedron);
        //var wireframe = new THREE.WireframeHelper( polyhedron, 0x00ff00 );
        //scene.add(wireframe);


        //var slabObject = scene.getObjectByName(currentBlcokName+"_IfcSlab");
        //var stairObject = scene.getObjectByName(currentBlcokName+"_IfcStair");
        //var WallStandardCaseObject = scene.getObjectByName(currentBlcokName+"_IfcWallStandardCase");
        //var WallObject = scene.getObjectByName(currentBlcokName+"_IfcWall");
        //var BuildingElementObject = scene.getObjectByName(currentBlcokName+"_IfcBuildingElementProxy");
        //
        //
        //downArr.push(slabObject);
        //downArr.push(stairObject);
        //forArr.push(WallStandardCaseObject);
        //forArr.push(WallObject);
        //forArr.push(BuildingElementObject);


        //modelDataNewN = [];
        //modelDataM = [];
        //modelDataV = [];
        //modelDataT = [];
        //modelDataF = [];

        //加载完成
        isOnload = false;

        $("#progress").removeClass("in")
        setTimeout(function(){
            $("#progress").css("display","none");

        },20)
        $("body,html").css({"overflow":"auto"})
        TranslateGroup();
    }

    var redrawGroup = [];
    function DrawComponentByFileName(fileName)
    {
        if(fileName!=null)
        {
            if (modelDataNewN[fileName]) {

                var newName = modelDataNewN[fileName];
                var matrix = modelDataM[fileName];
//                            处理V矩阵，变形
                if(modelDataV[newName])
                {
                    modelDataV[fileName] = [];
                    for(var dataCount=0;dataCount<modelDataV[newName].length;dataCount++)
                    {
                        var vMetrix = [];
                        var tMetrix = [];
                        //var vArrary = [];
                        for (var j = 0; j < modelDataV[newName][dataCount].length; j += 3) {
                            var newN1 = modelDataV[newName][dataCount][j] * matrix[0] + modelDataV[newName][dataCount][j + 1] * matrix[4] + modelDataV[newName][dataCount][j + 2] * matrix[8] + 1.0 * matrix[12];
                            var newN2 = modelDataV[newName][dataCount][j] * matrix[1] + modelDataV[newName][dataCount][j + 1] * matrix[5] + modelDataV[newName][dataCount][j + 2] * matrix[9] + 1.0 * matrix[13];
                            var newN3 = modelDataV[newName][dataCount][j] * matrix[2] + modelDataV[newName][dataCount][j + 1] * matrix[6] + modelDataV[newName][dataCount][j + 2] * matrix[10]+ 1.0 * matrix[14];
                            var groupV = new THREE.Vector3(newN1, newN3, newN2);
                            vMetrix.push(groupV);
                            //vArrary.push(newN1);
                            //vArrary.push(newN2);
                            //vArrary.push(newN3);
                        }
                        //modelDataV[fileName].push(vArrary);
                        //处理T矩阵
                        for (var m = 0; m < modelDataT[newName][dataCount].length; m += 3) {
                            var newT1 = 1.0 * modelDataT[newName][dataCount][m];
                            var newT2 = 1.0 * modelDataT[newName][dataCount][m + 1];
                            var newT3 = 1.0 * modelDataT[newName][dataCount][m + 2];
                            //var newF1 = 1.0 * modelDataF[newName][dataCount][m] * matrix[0] + modelDataF[newName][dataCount][m + 1] * matrix[4] + modelDataF[newName][dataCount][m + 2] * matrix[8] + 1.0 * matrix[12];
                            //var newF2 = 1.0 * modelDataF[newName][dataCount][m] * matrix[1] + modelDataF[newName][dataCount][m + 1] * matrix[5] + modelDataF[newName][dataCount][m + 2] * matrix[9] + 1.0 * matrix[13];
                            //var newF3 = 1.0 * modelDataF[newName][dataCount][m] * matrix[2] + modelDataF[newName][dataCount][m + 1] * matrix[6] + modelDataF[newName][dataCount][m + 2] * matrix[10]+ 1.0 * matrix[14];
                            var newF1 = 1.0 * modelDataF[newName][dataCount][m];
                            var newF2 = 1.0 * modelDataF[newName][dataCount][m + 1];
                            var newF3 = 1.0 * modelDataF[newName][dataCount][m + 2];
                            var norRow = new THREE.Vector3(newF1, newF2, newF3);
                            var grouT = new THREE.Face3(newT1, newT2, newT3);
                            grouT.normal = norRow;
                            tMetrix.push(grouT);
                        }
                        //绘制
                        var geometry = new THREE.Geometry();
                        geometry.vertices = vMetrix;
                        geometry.faces = tMetrix;
                        var pos=fileName.indexOf("=");
                        var ind=fileName.substring(pos+1);
                        var polyhedron = createMesh(geometry,currentBlcokName,ind);
                        scene.add(polyhedron);
                        redrawGroup.push(polyhedron);

                    }
                }
            }
            if (modelDataV[fileName] && !modelDataNewN[fileName]) {
                for(var dataCount=0;dataCount<modelDataV[fileName].length;dataCount++)
                {
                    var vMetrix = [];
                    var tMetrix = [];
                    //处理V矩阵，变形
                    for (var j = 0; j < modelDataV[fileName][dataCount].length; j += 3) {
                        var newn1 = 1.0 * modelDataV[fileName][dataCount][j];
                        var newn2 = 1.0 * modelDataV[fileName][dataCount][j + 1];
                        var newn3 = 1.0 * modelDataV[fileName][dataCount][j + 2];
                        var groupV = new THREE.Vector3(newn1, newn3, newn2);
                        vMetrix.push(groupV);
                    }
                    //处理T矩阵
                    for (var m = 0; m < modelDataT[fileName][dataCount].length; m += 3) {
                        var newT1 = 1.0 * modelDataT[fileName][dataCount][m];
                        var newT2 = 1.0 * modelDataT[fileName][dataCount][m + 1];
                        var newT3 = 1.0 * modelDataT[fileName][dataCount][m + 2];
                        var newF1 = 1.0 * modelDataF[fileName][dataCount][m];
                        var newF2 = 1.0 * modelDataF[fileName][dataCount][m + 1];
                        var newF3 = 1.0 * modelDataF[fileName][dataCount][m + 2];
                        var norRow = new THREE.Vector3(newF1, newF2, newF3);
                        var groupF = new THREE.Face3(newT1, newT2, newT3);
                        groupF.normal = norRow;
                        tMetrix.push(groupF);
                    }

                    //绘制
                    var geometry = new THREE.Geometry();
                    geometry.vertices = vMetrix;
                    geometry.faces = tMetrix;
                    var pos=fileName.indexOf("=");
                    var ind=fileName.substring(pos+1);
                    var polyhedron = createMesh(geometry,currentBlcokName,ind);
                    scene.add(polyhedron);
                    redrawGroup.push(polyhedron);

                }
            }
        }
    }

    function redrawComponentByPosition(x,y,z,name)
    {
        var indexX = Math.ceil((x - SceneBBoxMinX )/VoxelSize);
        var indexZ = Math.ceil((z - SceneBBoxMinY )/VoxelSize);
        var indexY = Math.ceil((y - SceneBBoxMinZ )/VoxelSize);
        var index = indexX + "-" + indexZ + "-" + indexY;
        var VoxelizationFileArr;

        VoxelizationFileArr = vsgData[index];
        if(VoxelizationFileArr)
        {
            for(var i=0; i<VoxelizationFileArr.length; i++)
            {
                var pos=VoxelizationFileArr[i].indexOf("=");
                var ind=VoxelizationFileArr[i].substring(pos+1);
                if(ind==name)
                {
                    DrawComponentByFileName(VoxelizationFileArr[i]);
                }
            }
        }
    }

    function destroyGroup()
    {
        downArr = [];
        forArr = [];
        var deleteNameArr = [];
        for(var i=0; i<scene.children.length;i++)
        {
            if(scene.children[i].name)
            {
                // console.log(scene.children[i].name);
                var pos = scene.children[i].name.indexOf("_");
                if(scene.children[i].name.substring(0,pos) == preBlockName)
                {
                    scene.children[i].geometry.dispose();
                    scene.children[i].geometry.vertices = null;
                    scene.children[i].geometry.faces = null;
                    scene.children[i].geometry.faceVertexUvs = null;
                    scene.children[i].geometry = null;
                    scene.children[i].material.dispose();
                    scene.children[i].material = null;
                    scene.children[i].children = [];
                    deleteNameArr.push(scene.children[i].name);
                }
            }
        }

        for(var i=0; i<deleteNameArr.length;i++)
        {
            var deleteObject = scene.getObjectByName(deleteNameArr[i]);
            scene.remove(deleteObject);
            deleteObject = null;
        }
    }

    function destroyGroup_before()
    {
        downArr = [];
        forArr = [];
        var deleteNameArr = [];
        for(var i=0; i<scene.children.length;i++)
        {
            if(scene.children[i].name)
            {
                // console.log(scene.children[i].name);
                var pos = scene.children[i].name.indexOf("_");
                if(scene.children[i].name.substring(0,pos) == preBlockName)
                {
                    var deleteObject = scene.getObjectByName(scene.children[i].name);
                    scene.remove(deleteObject);
                    deleteObject.geometry.dispose();
                    deleteObject.geometry.vertices = null;
                    deleteObject.geometry.faces = null;
                    deleteObject.geometry.faceVertexUvs = null;
                    deleteObject.geometry = null;
                    deleteObject.material.dispose();
                    deleteObject.material = null;
                    deleteObject.children = [];
                    //deleteNameArr.push(scene.children[i].name);
                    i--;
                }
            }
        }

    }

    function TranslateGroup()
    {
        VoxelSize = cashVoxelSize;
        SceneBBoxMinX = cashSceneBBoxMinX;
        SceneBBoxMinY = cashSceneBBoxMinY;
        SceneBBoxMinZ = cashSceneBBoxMinZ;
        triggerAreaMap = cashtriggerAreaMap;
        wallArr = cashWallArr;
        // console.log(triggerAreaMap)

        if(isShowTriggerArea)
        {
            while(triggerBoxs.length){
                scene.remove(triggerBoxs.pop());
            }
            while(wallBoxs.length){
                scene.remove(wallBoxs.pop());
            }

            for(var i in triggerAreaMap){

                if(triggerAreaMap.hasOwnProperty(i)){

                    for(var j = 0;j < triggerAreaMap[i].length;j ++){

                        //console.log(triggerAreaMap[i])

                        var triggerX = Number(triggerAreaMap[i][j][3]);
                        var triggerY = triggerAreaMap[i][j][7];
                        var triggerZ = triggerAreaMap[i][j][8];

                        var sphereGeo = new THREE.CubeGeometry(2*triggerX,2*triggerY,2*triggerZ);


                        var sphereMesh = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
                            opacity:0.5,
                            color: 0x000000,
                            transparent:true,
                            wireframe: false,
                            side: THREE.DoubleSide
                        }));
                        sphereMesh.position.x =   Number(triggerAreaMap[i][j][0]);
                        sphereMesh.position.z =  Number(triggerAreaMap[i][j][1]);
                        sphereMesh.position.y =  Number(triggerAreaMap[i][j][2]);
                        scene.add(sphereMesh);

                        triggerBoxs.push(sphereMesh);
                        wallBoxs.push(sphereMesh);

                    }

                }

            }


            for(var m=0;m<wallArr.length;m++)
            {
                var posX = Number(wallArr[m][0]);
                var posY = Number(wallArr[m][1]);
                var posZ = Number(wallArr[m][2]);
                var boxX = Number(wallArr[m][3]);
                var boxY = Number(wallArr[m][4]);
                var boxZ = Number(wallArr[m][5]);

                var sphereGeo = new THREE.CubeGeometry(2*boxX,2*boxY,2*boxZ);


                var sphereMesh = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({
                    opacity:0.0,
                    transparent:true,
                    color: 0x0099ff,
                    wireframe: false
                    //side: THREE.DoubleSide
                }));
                sphereMesh.position.x =  posX;
                sphereMesh.position.y =  posY;
                sphereMesh.position.z =  posZ;
                scene.add(sphereMesh);

                wallBoxs.push(sphereMesh);
                forArr.push(sphereMesh);
                downArr.push(sphereMesh);


            }

        }

    }


    function toDecimal2(x) {
        var f = parseFloat(x);
        if (isNaN(f)) {
            return false;
        }
        var f = Math.round(x*100)/100;
        var s = f.toString();
        var rs = s.indexOf('.');
        if (rs < 0) {
            rs = s.length;
            s += '.';
        }
        while (s.length <= rs + 2) {
            s += '0';
        }
        return s;
    }



    render();
    clock.start();  //启动计时器

    var isCollision = false;

    var jumpPosition = new THREE.Vector3();
    var backPosition = new THREE.Vector3();
    var triggerKey;
    function render() {

        stats.update();

        var delta = clock.getDelta();

        if(!isOnload)
        {

            camControls.update(delta);
            renderer.render(scene, camera);
            //var vec = MovingCube.geometry.vertices[0].clone();
            //vec = MovingCube.localToWorld(vec);
            lables.CameraPosition = toDecimal2(camera.position.x) + "," + toDecimal2(camera.position.y) + "," + toDecimal2(camera.position.z);
            //lables.cameraY = camera.position.y;
            //lables.cameraZ = camera.position.z;
            //lables.cameraTongX = Math.round((camControls.targetObject.position.x - SceneBBoxMinX )/VoxelSize);
            //lables.cameraTongZ = Math.round((camControls.targetObject.position.z - SceneBBoxMinY )/VoxelSize);
            //lables.cameraTongY = Math.round((camControls.targetObject.position.y - SceneBBoxMinZ )/VoxelSize);
            //lables.pointX = camControls.targetObject.position.x;
            //lables.pointY = camControls.targetObject.position.y;
            //lables.pointZ = currentBlcokName;

            //var voxelizedPosX = Math.round((camControls.targetObject.position.x - SceneBBoxMinX )/VoxelSize);
            //var voxelizedPosZ = Math.round((camControls.targetObject.position.z - SceneBBoxMinY )/VoxelSize);
            //var voxelizedPosY = Math.round((camControls.targetObject.position.y - SceneBBoxMinZ )/VoxelSize);

			
            //
            for(var i = 0; i <spheres.length;i++){


                var r = computeRadius(spheres[i].position,camera.position);

               spheres[i].scale.set(r/10,r/10,r/10)

            }
            for(var j = 0;j <signals.length;j++){
                for(var num = 0;num < signals[j].spheres.length;num++){
                    var r = computeRadius(signals[j].spheres[num].position,camera.position);

                    signals[j].spheres[num].scale.set(r/10,r/10,r/10)
                }
            }







            isCollision = false;

            //var p = testCollisionByVoxelization(lables.cameraTongX,lables.cameraTongY,lables.cameraTongZ);
            //if(p)
            //{
            //    console.log("collision !");
            //    var cp = new THREE.Vector3();
            //    cp.subVectors(camControls.targetObject.position,p);
            //    cp.normalize();
            //    camControls.targetObject.position.set(p.x+cp.x, p.y+cp.y, p.z+cp.z);
            //    //isCollision = true;
            //}

            rayCollision();


            for(var key in triggerAreaMap)
            {
                for(var i=0;i<triggerAreaMap[key].length;i++)
                {
                    var triggerX1 = Number(triggerAreaMap[key][i][0]);
                    var triggerY1 = Number(triggerAreaMap[key][i][2]);
                    var triggerZ1 = Number(triggerAreaMap[key][i][1]);
                    var triggerX = Number(triggerAreaMap[key][i][3]);
                    var triggerY = triggerAreaMap[key][i][8];
                    var triggerZ = triggerAreaMap[key][i][7];
                    var tempMinX1 = triggerX1 - triggerX;
                    var tempMinY1 = triggerY1 - triggerY;
                    var tempMinZ1 = triggerZ1 - triggerZ;
                    var tempMaxX1 = triggerX1 + triggerX;
                    var tempMaxY1 = triggerY1 + triggerY;
                    var tempMaxZ1 = triggerZ1 + triggerZ;

                    var isInArea1 = camControls.targetObject.position.x>tempMinX1 &&
                        camControls.targetObject.position.x<tempMaxX1 &&
                        camControls.targetObject.position.y>tempMinY1 &&
                        camControls.targetObject.position.y<tempMaxY1 &&
                        camControls.targetObject.position.z>tempMinZ1 &&
                        camControls.targetObject.position.z<tempMaxZ1;

                    if(isInArea1)
                    {

                        //弹出窗口
                        $("#triggerUI").css({"display":"block"});
                        setTimeout(function(){
                            $("#triggerUI").addClass("in");
                            isOnload = true;
                        },10)
                        $("body,html").css({"overflow":"hidden"})
                        console.log("in trigger area");
                        isOnload = true;
                        triggerKey = key;
                        var triggerX2 = Number(triggerAreaMap[triggerKey][i][4]);
                        var triggerY2 = Number(triggerAreaMap[triggerKey][i][6]);
                        var triggerZ2 = Number(triggerAreaMap[triggerKey][i][5]);
                        var trigger1Position = new THREE.Vector3(triggerX1,triggerY1,triggerZ1);
                        var trigger2Position = new THREE.Vector3(triggerX2,triggerY2,triggerZ2);
                        var directionVector = new THREE.Vector3();
                        directionVector.subVectors(trigger2Position,trigger1Position);
                        //directionVector.normalize();
                        jumpPosition.set(triggerX2,triggerY2,triggerZ2);
                        backPosition.set(triggerX1-directionVector.x*1,triggerY1-directionVector.y*1,triggerZ1-directionVector.z*1);
                        //console.log("trigger1:"+trigger1Position.x+"_"+trigger1Position.y+"_"+trigger1Position.z);
                        //console.log("trigger2:"+trigger2Position.x+"_"+trigger2Position.y+"_"+trigger2Position.z);
                        //console.log("jumpPosition:"+jumpPosition.x+"_"+jumpPosition.y+"_"+jumpPosition.z);
                        //console.log("backPosition:"+backPosition.x+"_"+backPosition.y+"_"+backPosition.z);

                        //preBlockName = currentBlcokName;
                        //currentBlcokName = triggerKey;
                        //workerLoadVsg.postMessage(currentBlcokName);
                        //destroyGroup();
                        //camControls.targetObject.position.set(triggerX2,triggerY2,triggerZ2);

                    }
                }
            }



            //更改摄像机的位置
            //if(!isCollision)
            //{
            //    camControls.object.position.set(camControls.targetObject.position.x,camControls.targetObject.position.y,camControls.targetObject.position.z);
            //}
            //else
            //{
            //    camControls.targetObject.position.set(camControls.object.position.x,camControls.object.position.y,camControls.object.position.z);
            //}
            camControls.object.position.set(camControls.targetObject.position.x,camControls.targetObject.position.y,camControls.targetObject.position.z);

        }
        requestAnimationFrame(render);
    }

    function rayCollision()
    {


        var ray = new THREE.Raycaster( camControls.targetObject.position, new THREE.Vector3(0,-1,0),0,1.5 );
        var collisionResults = ray.intersectObjects( downArr );
        if(collisionResults.length>0 && (collisionResults[0].distance<1.2 || collisionResults[0].distance>=1.2))
        {
//                        camControls.targetObject.translateY( 5*clock.getDelta() );
            camControls.targetObject.position.set(camControls.targetObject.position.x,collisionResults[0].point.y+1.2,camControls.targetObject.position.z);
        }

        var upRay = new THREE.Raycaster( camControls.targetObject.position, new THREE.Vector3(0,1,0),0,1.5 );
        var collisionResults = upRay.intersectObjects( downArr );
        if(collisionResults.length>0 && collisionResults[0].distance<1.2)
        {
            //isCollision = true;
            //camControls.targetObject.translateZ( 1*camControls.movementSpeed*clock.getDelta() );
            var cp = new THREE.Vector3();
            cp.subVectors(camControls.targetObject.position,collisionResults[0].point);
            cp.normalize();
            camControls.targetObject.position.set(collisionResults[0].point.x+cp.x, collisionResults[0].point.y+cp.y-0.2, collisionResults[0].point.z+cp.z);
        }
        var forVec = new THREE.Vector3(0,0,-1);
        forVec = camControls.targetObject.localToWorld(forVec);
        var forRay = new THREE.Raycaster( camControls.targetObject.position, forVec,0,0.6 );
        var collisionResults = forRay.intersectObjects( forArr );
        if(collisionResults.length>0 && collisionResults[0].distance<0.45)
        {
            //isCollision = true;
            //camControls.targetObject.translateZ( 1*camControls.movementSpeed*clock.getDelta() );
            var cp = new THREE.Vector3();
            cp.subVectors(camControls.targetObject.position,collisionResults[0].point);
            cp.normalize();
            camControls.targetObject.position.set(collisionResults[0].point.x+cp.x/2, collisionResults[0].point.y+cp.y/2, collisionResults[0].point.z+cp.z/2);
        }
        var lefVec = new THREE.Vector3(-1,0,0);
        lefVec = camControls.targetObject.localToWorld(lefVec);
        var lefRay = new THREE.Raycaster( camControls.targetObject.position, lefVec,0,0.6 );
        var collisionResults = lefRay.intersectObjects( forArr );
        if(collisionResults.length>0 && collisionResults[0].distance<0.45)
        {
            //isCollision = true;
            //camControls.targetObject.translateX( 1*camControls.movementSpeed*clock.getDelta() );
            var cp = new THREE.Vector3();
            cp.subVectors(camControls.targetObject.position,collisionResults[0].point);
            cp.normalize();
            camControls.targetObject.position.set(collisionResults[0].point.x+cp.x/2, collisionResults[0].point.y+cp.y/2, collisionResults[0].point.z+cp.z/2);
        }
        var rigVec = new THREE.Vector3(1,0,0);
        rigVec = camControls.targetObject.localToWorld(rigVec);
        var rigRay = new THREE.Raycaster( camControls.targetObject.position, rigVec,0,0.6 );
        var collisionResults = rigRay.intersectObjects( forArr );
        if(collisionResults.length>0 && collisionResults[0].distance<0.45)
        {
            //isCollision = true;
            //camControls.targetObject.translateX( -1*camControls.movementSpeed*clock.getDelta() );
            var cp = new THREE.Vector3();
            cp.subVectors(camControls.targetObject.position,collisionResults[0].point);
            cp.normalize();
            camControls.targetObject.position.set(collisionResults[0].point.x+cp.x/2, collisionResults[0].point.y+cp.y/2, collisionResults[0].point.z+cp.z/2);
        }
        var bacVec = new THREE.Vector3(0,0,1);
        bacVec = camControls.targetObject.localToWorld(bacVec);
        var bacRay = new THREE.Raycaster( camControls.targetObject.position, bacVec,0,0.6 );
        var collisionResults = bacRay.intersectObjects( forArr );
        if(collisionResults.length>0 && collisionResults[0].distance<0.45)
        {
            //isCollision = true;
            //camControls.targetObject.translateZ( -1*camControls.movementSpeed*clock.getDelta() );
            var cp = new THREE.Vector3();
            cp.subVectors(camControls.targetObject.position,collisionResults[0].point);
            cp.normalize();
            camControls.targetObject.position.set(collisionResults[0].point.x+cp.x/2, collisionResults[0].point.y+cp.y/2, collisionResults[0].point.z+cp.z/2);
        }
    }


    function testCollisionByVoxelization(x,y,z)
    {
        var key = x + "-" + z + "-" + y;
        var VoxelizationFileArr;

        VoxelizationFileArr = vsgData[key];

        if(VoxelizationFileArr)
        {
            for(var v=0; v<VoxelizationFileArr.length; v++)
            {
                var fileName = VoxelizationFileArr[v];
                var pos=fileName.indexOf("=");
                var ind=fileName.substring(pos+1);
                if(ind=="IfcSlab"||ind=="IfcBuildingElementProxy"||ind=="IfcWall"||ind=="IfcWallStandardCase"||ind=="IfcStair"||ind=="IfcRamp")
                {
                    if (modelDataNewN[fileName])
                    {
                        var newName = modelDataNewN[fileName];

                        for(var dataCount=0;dataCount<modelDataT[newName].length;dataCount++)
                        {
                            for (var j = 0; j < modelDataT[newName][dataCount].length; j += 3)
                            {
                                var a1 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[newName][dataCount][j+0])+0];
                                var a2 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[newName][dataCount][j+0])+2];
                                var a3 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[newName][dataCount][j+0])+1];
                                var b1 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[newName][dataCount][j+1])+0];
                                var b2 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[newName][dataCount][j+1])+2];
                                var b3 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[newName][dataCount][j+1])+1];
                                var c1 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[newName][dataCount][j+2])+0];
                                var c2 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[newName][dataCount][j+2])+2];
                                var c3 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[newName][dataCount][j+2])+1];
                                var pointa = new THREE.Vector3(a1,a2,a3);
                                var pointb = new THREE.Vector3(b1,b2,b3);
                                var pointc = new THREE.Vector3(c1,c2,c3);
                                var p = ClosestPtPointTriangle(camControls.targetObject.position,pointa,pointb,pointc);
                                var d = new THREE.Vector3();
                                d.subVectors(p,camControls.targetObject.position);
                                var dsq = d.dot(d);
                                if(dsq<1)
                                {
                                    //console.log(key);
                                    return p;
                                }
                            }
                        }
                    }
                    if (modelDataV[fileName] && !modelDataNewN[fileName])
                    {
                        for(var dataCount=0;dataCount<modelDataT[fileName].length;dataCount++)
                        {
                            for (var j = 0; j < modelDataT[fileName][dataCount].length; j += 3)
                            {
                                //这里可能有问题，明天继续看！！！
                                var a1 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[fileName][dataCount][j+0])+0];
                                var a2 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[fileName][dataCount][j+0])+2];
                                var a3 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[fileName][dataCount][j+0])+1];
                                var b1 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[fileName][dataCount][j+1])+0];
                                var b2 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[fileName][dataCount][j+1])+2];
                                var b3 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[fileName][dataCount][j+1])+1];
                                var c1 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[fileName][dataCount][j+2])+0];
                                var c2 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[fileName][dataCount][j+2])+2];
                                var c3 = 1.0*modelDataV[fileName][dataCount][3*(modelDataT[fileName][dataCount][j+2])+1];
                                var pointa = new THREE.Vector3(a1,a2,a3);
                                var pointb = new THREE.Vector3(b1,b2,b3);
                                var pointc = new THREE.Vector3(c1,c2,c3);
                                var p = ClosestPtPointTriangle(camControls.targetObject.position,pointa,pointb,pointc);
                                var d = new THREE.Vector3();
                                d.subVectors(p,camControls.targetObject.position);
                                var dsq = d.dot(d);
                                if(dsq<1)
                                {
                                    //console.log(key);
                                    return p;
                                }
                            }
                        }
                    }
                }
            }
        }
    }


    function ClosestPtPointTriangle(p,a,b,c)
    {
        var ab = new THREE.Vector3();
        var ac = new THREE.Vector3();
        var bc = new THREE.Vector3();
        var ap = new THREE.Vector3();
        var bp = new THREE.Vector3();
        var cp = new THREE.Vector3();


        //Check if P in vertex region outside A
        ab.subVectors(b,a);
        ac.subVectors(c,a);
        ap.subVectors(p,a);
        var d1 = ap.dot(ab);
        var d2 = ap.dot(ac);
        if(d1<=0.0 && d2<=0.0) return a;

        //Check if P in vertex region outside B
        bp.subVectors(p,b);
        var d3 = bp.dot(ab);
        var d4 = bp.dot(ac);
        if(d3>=0.0 && d4<=d3) return b;

        //Check if P in edge region of AB, if so return projection of P onto AB
        var vc = d1*d4 - d3*d2;
        if(vc<=0.0 && d1>=0.0 && d3<=0.0)
        {
            var v = d1/(d1-d3);
            return new THREE.Vector3(a.x+ab.x*v, a.y+ab.y*v, a.z+ab.z*v);
        }

        //Check if P in vertex region outside C
        cp.subVectors(p,c);
        var d5 = cp.dot(ab);
        var d6 = cp.dot(ac);
        if(d6>=0.0 && d5<=d6) return c;

        //Check if P in edge region of AC, if so return projection of P onto AC
        var vb = d5*d2 - d1*d6;
        if(vb<=0.0 && d2>=0.0 && d6<=0.0)
        {
            var w = d2/(d2-d6);
            return new THREE.Vector3(a.x+ac.x*w, a.y+ac.y*w, a.z+ac.z*w);
        }

        //Check if P in edge region of BC, if so return projection of P onto BC
        var va = d3*d6 - d5*d4;
        bc.subVectors(c,b);
        if(va<=0.0 && (d4-d3)>=0.0 && (d5-d6)>=0.0)
        {
            var w = (d4-d3)/((d4-d3)+(d5-d6));
            return new THREE.Vector3(b.x + bc.x*w, b.y + bc.y*w, b.z + bc.z*w);
        }

        //P inside face region. Compute Q through its barycentric coordinates (u,v,w)
        var denom = 1.0/(va+vb+vc);
        var v = vb * denom;
        var w = vc * denom;
        return new THREE.Vector3(a.x+ab.x*v+ac.x*w, a.y+ab.y*v+ac.y*w, a.z+ab.z*v+ac.z*w);
    }

    var texture1 = THREE.ImageUtils.loadTexture( './assets/textures/texture1.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture1.anisotropy = maxAnisotropy;
    texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
    texture1.repeat.set( 1, 1 );
    var material1 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});


    var texture2 = THREE.ImageUtils.loadTexture( './assets/textures/texture2.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture2.anisotropy = maxAnisotropy;
    texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
    texture2.repeat.set( 1, 1 );
    var material2 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture2,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});


    var texture3 = THREE.ImageUtils.loadTexture( './assets/textures/texture3.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture3.anisotropy = maxAnisotropy;
    texture3.wrapS = texture3.wrapT = THREE.RepeatWrapping;
    texture3.repeat.set( 1, 1 );
    var material3 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture3,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});


    var texture4 = THREE.ImageUtils.loadTexture( './assets/textures/texture4.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture4.anisotropy = maxAnisotropy;
    texture4.wrapS = texture4.wrapT = THREE.RepeatWrapping;
    texture4.repeat.set( 1, 1 );
    var material4 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture4,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});


    var texture5 = THREE.ImageUtils.loadTexture( './assets/textures/texture5.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture5.anisotropy = maxAnisotropy;
    texture5.wrapS = texture5.wrapT = THREE.RepeatWrapping;
    texture5.repeat.set( 1, 1 );
    var material5 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture5,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});


    var texture6 = THREE.ImageUtils.loadTexture( './assets/textures/texture6.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture6.anisotropy = maxAnisotropy;
    texture6.wrapS = texture6.wrapT = THREE.RepeatWrapping;
    texture6.repeat.set( 1, 1 );
    var material6 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture6,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});


    var texture7 = THREE.ImageUtils.loadTexture( './assets/textures/texture7.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture7.anisotropy = maxAnisotropy;
    texture7.wrapS = texture7.wrapT = THREE.RepeatWrapping;
    texture7.repeat.set( 1, 1 );
    var material7 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture7,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});


    var texture8 = THREE.ImageUtils.loadTexture( './assets/textures/texture1.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture8.anisotropy = maxAnisotropy;
    texture8.wrapS = texture8.wrapT = THREE.RepeatWrapping;
    texture8.repeat.set( 1, 1 );
    var material8 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture8,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});


    var texture9 = THREE.ImageUtils.loadTexture( './assets/textures/texture9.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture9.anisotropy = maxAnisotropy;
    texture9.wrapS = texture9.wrapT = THREE.RepeatWrapping;
    texture9.repeat.set( 1, 1 );
    var material9 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture9,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});


    var texture10 = THREE.ImageUtils.loadTexture( './assets/textures/texture10.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture10.anisotropy = maxAnisotropy;
    texture10.wrapS = texture10.wrapT = THREE.RepeatWrapping;
    texture10.repeat.set( 1, 1 );
    var material10 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture10,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});


    var texture11 = THREE.ImageUtils.loadTexture( './assets/textures/texture11.jpg' );
    var maxAnisotropy = renderer.getMaxAnisotropy();
    texture11.anisotropy = maxAnisotropy;
    texture11.wrapS = texture11.wrapT = THREE.RepeatWrapping;
    texture11.repeat.set( 1, 1 );
    var material11 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture11,side: THREE.DoubleSide,shininess:5000,opacity:1,transparent:true});

    
     function createMesh(geom,block,nam) {

        //console.log(nam)
        var start = nam.indexOf('=')+1;
        var end = nam.indexOf('-');

        var trueName = nam.slice(start,end);
        //console.log(trueName)

        


        var mesh;
        var color = new THREE.Color( 0xff0000 );
        var myOpacity = 1;
        switch (nam) {
            case"IfcFooting":
                color =new THREE.Color( 0xFFBFFF );
                break;
            case "IfcWallStandardCase"://ok
                color =new THREE.Color( 0xaeb1b3 );
                break;
            case "IfcSlab"://ok
                color = new THREE.Color( 0x9caeba );
                myOpacity = 0.9;
                break;
            case "IfcStair"://ok
                color =new THREE.Color( 0x274456 );
                break;
            case "IfcDoor"://ok
                color =new THREE.Color( 0xfcaa49 );
                break;
            case "IfcWindow":
                color =new THREE.Color( 0x00ffff );
                break;
            case "IfcBeam"://ok
                color =new THREE.Color( 0x06e5e5 );
                break;
            case "IfcCovering":
                color = new THREE.Color( 0x999999 );
                break;
            case "IfcFlowSegment"://ok
                color = new THREE.Color( 0xd90c0c );
                break;
            case "IfcWall"://ok
                color = new THREE.Color( 0xaeb1b3 );
                break;
            case "IfcRamp":
                color = new THREE.Color( 0x333333 );
                break;
            case "IfcRailing"://ok
                color = new THREE.Color( 0xaeaeae );
                break;
            case "IfcFlowTerminal"://ok
                color = new THREE.Color( 0xffffff );
                break;
            case "IfcBuildingElementProxy"://ok
                color = new THREE.Color( 0x1e2e35 );
                myOpacity = 0.7;
                break;
            case "IfcColumn"://ok
                color = new THREE.Color( 0xfee972 );
                break;
            case "IfcFlowController"://ok
                color = new THREE.Color( 0x2c2d2b );
                break;
            case "IfcFlowFitting"://ok
                color = new THREE.Color( 0xffffff );
                break;
            default:
                color = new THREE.Color( 0x274456 );
                break;

        }

        var material0 = new THREE.MeshPhongMaterial({ alphaTest: 0.5, color: color, specular: 0xffae00,side: THREE.DoubleSide});


        switch (nam) {
            //case"IfcFooting":
            //
            //    mesh = new THREE.Mesh(geom, material2);
            //    break;
            // case "IfcWallStandardCase"://ok
            //     if(geom.faces[0]){
            //         var normal = geom.faces[0].normal;
            //         var directU,directV;
            //         if(String(normal.x) === '1'){
            //             directU = new THREE.Vector3(0,1,0);
            //             directV = new THREE.Vector3(0,0,1);
            //         }else if(String(normal.y) === '1'){
            //             directU = new THREE.Vector3(1,0,0);
            //             directV = new THREE.Vector3(0,0,1);
            //         }else{
            //             directU = new THREE.Vector3(0,1,0);
            //             directV = new THREE.Vector3(1,0,0);
            //         }
            //
            //         for(var i=0; i<geom.faces.length; ++i){
            //             var uvArray = [];
            //             for(var j=0; j<3; ++j) {
            //                 var point;
            //                 if(j==0)
            //                     point = geom.vertices[geom.faces[i].a];
            //                 else if(j==1)
            //                     point = geom.vertices[geom.faces[i].b];
            //                 else
            //                     point = geom.vertices[geom.faces[i].c];
            //
            //                 var tmpVec = new THREE.Vector3();
            //                 tmpVec.subVectors(point, geom.vertices[0]);
            //
            //                 var u = tmpVec.dot(directU);
            //                 var v = tmpVec.dot(directV);
            //
            //                 uvArray.push(new THREE.Vector2(u, v));
            //             }
            //             geom.faceVertexUvs[0].push(uvArray);
            //         }
            //     }
            //     mesh = new THREE.Mesh(geom, material3);
            //     break;
            //case "IfcSlab"://ok
            //
            //    mesh = new THREE.Mesh(geom, material3);
            //    break;
            //case "IfcStair"://ok
            //
            //    mesh = new THREE.Mesh(geom, material1);
            //    break;
            //case "IfcDoor"://ok
            //
            //    mesh = new THREE.Mesh(geom, material2);
            //    break;
            // case "IfcWindow":
            //     if(geom.faces[0]){
            //         var normal = geom.faces[0].normal;
            //         var directU,directV;
            //         if(String(normal.x) === '1'){
            //             directU = new THREE.Vector3(0,1,0);
            //             directV = new THREE.Vector3(0,0,1);
            //         }else if(String(normal.y) === '1'){
            //             directU = new THREE.Vector3(1,0,0);
            //             directV = new THREE.Vector3(0,0,1);
            //         }else{
            //             directU = new THREE.Vector3(0,1,0);
            //             directV = new THREE.Vector3(1,0,0);
            //         }
            //
            //         for(var i=0; i<geom.faces.length; ++i){
            //             var uvArray = [];
            //             for(var j=0; j<3; ++j) {
            //                 var point;
            //                 if(j==0)
            //                     point = geom.vertices[geom.faces[i].a];
            //                 else if(j==1)
            //                     point = geom.vertices[geom.faces[i].b];
            //                 else
            //                     point = geom.vertices[geom.faces[i].c];
            //
            //                 var tmpVec = new THREE.Vector3();
            //                 tmpVec.subVectors(point, geom.vertices[0]);
            //
            //                 var u = tmpVec.dot(directU);
            //                 var v = tmpVec.dot(directV);
            //
            //                 uvArray.push(new THREE.Vector2(u, v));
            //             }
            //             geom.faceVertexUvs[0].push(uvArray);
            //         }
            //     }
            //     mesh = new THREE.Mesh(geom, material11);
            //     break;
            //case "IfcBeam"://ok
            //
            //    mesh = new THREE.Mesh(geom, material9);
            //    break;
            //case "IfcCovering":
            //
            //    mesh = new THREE.Mesh(geom, material1);
            //    break;
            //case "IfcFlowSegment"://ok
            //
            //    mesh = new THREE.Mesh(geom, material5);
            //    break;
            case "IfcWall"://ok
                if(geom.faces[0]){
                    var normal = geom.faces[0].normal;
                    var directU,directV;
                    if(String(normal.x) === '1'){
                        directU = new THREE.Vector3(0,1,0);
                        directV = new THREE.Vector3(0,0,1);
                    }else if(String(normal.y) === '1'){
                        directU = new THREE.Vector3(1,0,0);
                        directV = new THREE.Vector3(0,0,1);
                    }else{
                        directU = new THREE.Vector3(0,1,0);
                        directV = new THREE.Vector3(1,0,0);
                    }

                    for(var i=0; i<geom.faces.length; ++i){
                        var uvArray = [];
                        for(var j=0; j<3; ++j) {
                            var point;
                            if(j==0)
                                point = geom.vertices[geom.faces[i].a];
                            else if(j==1)
                                point = geom.vertices[geom.faces[i].b];
                            else
                                point = geom.vertices[geom.faces[i].c];

                            var tmpVec = new THREE.Vector3();
                            tmpVec.subVectors(point, geom.vertices[0]);

                            var u = tmpVec.dot(directU);
                            var v = tmpVec.dot(directV);

                            uvArray.push(new THREE.Vector2(u, v));
                        }
                        geom.faceVertexUvs[0].push(uvArray);
                    }
                }
                mesh = new THREE.Mesh(geom, material3);
                break;
            //case "IfcRamp":
            //
            //    mesh = new THREE.Mesh(geom, material1);
            //    break;
            //case "IfcRailing"://ok
            //
            //    mesh = new THREE.Mesh(geom, material8);
            //    break;
            //case "IfcFlowTerminal"://ok
            //
            //    mesh = new THREE.Mesh(geom, material9);
            //    break;
            //case "IfcBuildingElementProxy"://ok
            //
            //    mesh = new THREE.Mesh(geom, material5);
            //    break;
            //case "IfcColumn"://ok
            //
            //    mesh = new THREE.Mesh(geom, material4);
            //    break;
            //case "IfcFlowController"://ok
            //
            //    mesh = new THREE.Mesh(geom, material1);
            //    break;
            //case "IfcFlowFitting"://ok
            //
            //    mesh = new THREE.Mesh(geom, material8);
            //    break;
            default:
                mesh = new THREE.Mesh(geom, material0);
                break;
        }

        mesh.name = block+"_"+nam;

        return mesh;

    }


    var intersects;
    var clickedSphere;
    var clickedIndex;
    var clickedNumber;
    var mouse = { x: 0, y: 0 }, INTERSECTED, projector;
    projector = new THREE.Projector();
    var pointArr = [];
    var projector2 = new THREE.Projector();
    var projectorPre = new THREE.Projector();
    var imageSrc ="assets/textures/2.jpg";
    var newDrawed = [];
    var spherePoint = []; //存储index和sphere的map
    var spheres = []; //存储临时点
    var signals = []; //存储index和addedSignal
    var points = [];  //存储所有的sphere


    document.getElementById('WebGL-output').addEventListener('dblclick',function(event){

        event.preventDefault();

        mouse.x = ( event.clientX / (window.innerWidth-200) ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        //首先判断是否是group数组中的，是的话直接绘制
        var vectorPre = new THREE.Vector3( mouse.x, mouse.y, 1 );
        projectorPre.unprojectVector( vectorPre, camera );
        var raycasterPre = new THREE.Raycaster( camera.position, vectorPre.sub( camera.position ).normalize() );

        var intersectsPre = raycasterPre.intersectObjects(redrawGroup);

        if(intersectsPre.length>0){
            if (INTERSECTED != intersectsPre[0].object) {

                for(var spN = 0;spN<spheres.length;spN++){
                    scene.remove(spheres[spN])
                }
                spheres = [];


                if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);


                INTERSECTED = intersectsPre[0].object;
                pointArr = [];



                intersectsPre[0].point.x += intersects[0].face.normal.x * 0.01;
                intersectsPre[0].point.y += intersects[0].face.normal.z * 0.01;
                intersectsPre[0].point.z += intersects[0].face.normal.y * 0.01;


                pointArr.push(intersectsPre[0].point)


                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                INTERSECTED.material.emissive.setHex(0xff0000);

            } else {

                intersectsPre[0].point.x += intersectsPre[0].face.normal.x * 0.01;
                intersectsPre[0].point.y += intersectsPre[0].face.normal.z * 0.01;
                intersectsPre[0].point.z += intersectsPre[0].face.normal.y * 0.01;

                pointArr.push(intersectsPre[0].point);


            }


            var r = computeRadius(intersectsPre[0].point,camera.position);
            console.log(r)
            var sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
            var sphereMesh =  new THREE.Mesh(sphereGeo,new THREE.MeshPhongMaterial({ alphaTest: 0.5, ambient: 0xcccccc, color: 0xffffff, specular: 0x030303, side: THREE.DoubleSide}));
            sphereMesh.position.x = intersectsPre[0].point.x;
            sphereMesh.position.y = intersectsPre[0].point.y;
            sphereMesh.position.z = intersectsPre[0].point.z;
			sphereMesh.scale.set(r/10,r/10,r/10);
            // console.log(sphereMesh.position);
            scene.add(sphereMesh);

            spheres.push(sphereMesh);
        }else{

            //清除redrawGroup中所有数据，从scene中移除，如果有之前的则移除,重置数据

            for(var groupNum = 0;groupNum<redrawGroup.length;groupNum++){

                scene.remove(redrawGroup[groupNum]);

            }
            redrawGroup=[];
            for(var spN = 0;spN<spheres.length;spN++){
                scene.remove(spheres[spN])
            }
            spheres = [];
            pointArr = [];

            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
            INTERSECTED = null;



            var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
            projector.unprojectVector( vector, camera );
            var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

            intersects = raycaster.intersectObjects( scene.children );



            //有相交时，分为四种情况：已经绘制出的图形，正在绘制的点，已经绘制出图形的点，正常的场景图形


            if ( intersects.length > 0 ) {


                var r = 0;
                while(true){
                    if(wallBoxs.indexOf(intersects[r].object)!=-1){
                        intersects.splice(0,1);
                    }else{
                        r++;
                    }
                    if(r==intersects.length){
                        break;
                    }
                }


                if( intersects.length > 0){

                    var flag = -1;

                    for(var num = 0;num<signals.length;num++){
                        if(signals[num].mesh == intersects[0].object){
                            flag = 1;
                            break;
                        }
                    }
                    if(flag !=-1){    //双击删除所绘制的图形，从场景中移除图形的点，移除图形，从signals中移除这个图形索引


                        $("#mask").css({"display":"block"});

                        setTimeout(function(){
                            $("#mask").addClass("in")

                        },1000)
                        $("body,html").css({"overflow":"hidden"})


                        $("#delete").click(function(){
                            for(var currenSp = 0;currenSp<signals[num].spheres.length;currenSp++){
                                scene.remove(signals[num].spheres[currenSp]);

                            }
                            signals.splice(num,1);
                            scene.remove(intersects[0].object);

                            $("#mask").removeClass("in")

                            setTimeout(function(){
                                $("#mask").css("display","none");

                            },1000)
                            $("body,html").css({"overflow":"auto"})

                        })

                        $("#submit").click(function(){

                            var src = $("input:checked").val();
                            if(src){


                                //变化
                                var currentSignal = signals[num];  //得到对应的addedSignal对象


                                var geo = new THREE.Geometry();

                                var curve=new THREE.ClosedSplineCurve3(currentSignal.pointsArray);

                                geo.vertices = curve.getPoints(30);

                                for (var i = 0; i < 29; i++) {
                                    geo.faces.push(new THREE.Face3(0, i + 1, i + 2));
                                }


                                //获取U的方向
                                var uDirVec = new THREE.Vector3();
                                uDirVec.subVectors(currentSignal.pointsArray[1], currentSignal.pointsArray[0]);
                                uDirVec.normalize();
                                //获取v的方向
                                var vDirVec = new THREE.Vector3();
                                vDirVec.subVectors(currentSignal.pointsArray[2], currentSignal.pointsArray[0]);
                                //先计算面的法向量
                                vDirVec.cross(uDirVec);
                                //然后得到与面法线和U方向同时垂直的v的方向
                                vDirVec.cross(uDirVec);
                                vDirVec.normalize();
                                var texture = THREE.ImageUtils.loadTexture(src, null, function(t){});
                                texture.wrapS = THREE.RepeatWrapping;
                                texture.wrapT = THREE.RepeatWrapping;
                                texture.repeat.set( 1, 1);

                                for(var i=0; i<geo.faces.length; ++i){
                                    var uvArray = [];
                                    for(var j=0; j<3; ++j) {
                                        var point;
                                        if(j==0)
                                            point = geo.vertices[geo.faces[i].a];
                                        else if(j==1)
                                            point = geo.vertices[geo.faces[i].b];
                                        else
                                            point = geo.vertices[geo.faces[i].c];

                                        var tmpVec = new THREE.Vector3();
                                        tmpVec.subVectors(point, currentSignal.pointsArray[0]);

                                        var u = tmpVec.dot(uDirVec);
                                        var v = tmpVec.dot(vDirVec);

                                        uvArray.push(new THREE.Vector2(u, v));
                                    }
                                    geo.faceVertexUvs[0].push(uvArray);
                                }

                                console.log(geo.faces);

                                var mater = new THREE.MeshBasicMaterial({map:texture, side: THREE.DoubleSide});
                                var p = new THREE.Mesh(geo, mater);
                                p.name = currentBlcokName + "_" + "p";
                                scene.add(p);

                                scene.remove(currentSignal.mesh)

                                signals[num].mesh = p;

                            }

                            $("#mask").removeClass("in")

                            setTimeout(function(){
                                $("#mask").css("display","none");

                            },1000)
                            $("body,html").css({"overflow":"auto"})


                        })
                    }else if(spheres.indexOf(intersects[0].object)!=-1){  //双击删除所点击的球体，从spheres中移除点的记录，从场景中移除点，从pointArr中移除相应的位置信息
                        var index = spheres.indexOf(intersects[0].object);
                        spheres.splice(index,1);
                        pointArr.splice(index,1);
                        scene.remove(intersects[0].object);
                    }else if(points.indexOf(intersects[0].object)!=-1){   //双击与所绘制的图形中的球体互动，遍历signals中每一项的spheres数组，存在则把clicked设置成目前的点
                        for(var spNum = 0;spNum<signals.length;spNum++){
                            if(signals[spNum].spheres.indexOf(intersects[0].object)!=-1){

                                clickedNumber=spNum;
                                clickedIndex = signals[spNum].spheres.indexOf(intersects[0].object);
                                clickedSphere=intersects[0].object;


                            }
                        }

                    } else {                                             //双击正常产生球体，分两种情况：所点击的不是之前的；所点击是之前的
                        console.log(intersects[0].face.normal)

                        var pos=intersects[0].object.name.indexOf("_");
                        var ind=intersects[0].object.name.substring(pos+1);

                        redrawComponentByPosition(intersects[0].point.x,intersects[0].point.y,intersects[0].point.z,ind);

                        var vector2 = new THREE.Vector3( mouse.x, mouse.y, 1 );
                        projector2.unprojectVector( vector2, camera );
                        var raycaster2 = new THREE.Raycaster( camera.position, vector2.sub( camera.position ).normalize() );

                        var intersects2 = raycaster2.intersectObjects( redrawGroup );


                        if(intersects2.length>0){
                            INTERSECTED = intersects2[0].object;
                            intersects2[0].point.x += intersects2[0].face.normal.x * 0.01;
                            intersects2[0].point.y += intersects2[0].face.normal.z * 0.01;
                            intersects2[0].point.z += intersects2[0].face.normal.y * 0.01;


                            pointArr.push(intersects2[0].point)


                            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                            INTERSECTED.material.emissive.setHex(0xff0000);

							var r = computeRadius(intersects2[0].point,camera.position);
                            console.log(r);
                            var sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
                            var sphereMesh =  new THREE.Mesh(sphereGeo,new THREE.MeshPhongMaterial({ alphaTest: 0.5, ambient: 0xcccccc, color: 0xffffff, specular: 0x030303, side: THREE.DoubleSide}));
                            sphereMesh.position.x = intersects2[0].point.x;
                            sphereMesh.position.y = intersects2[0].point.y;
                            sphereMesh.position.z = intersects2[0].point.z;
							sphereMesh.scale.set(r/10,r/10,r/10);
                            // console.log(sphereMesh.position);
                            scene.add(sphereMesh);

                            spheres.push(sphereMesh);
                        }




                        // if (INTERSECTED != intersects[0].object) {
                        //
                        //     for(var spN = 0;spN<spheres.length;spN++){
                        //         scene.remove(spheres[spN])
                        //     }
                        //     spheres = [];
                        //
                        //
                        //     if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
                        //
                        //
                        //     console.log(intersects[0])
                        //
                        //     INTERSECTED = intersects[0].object;
                        //     pointArr = [];
                        //
                        //
                        //
                        //     intersects[0].point.x += intersects[0].face.normal.x * 0.01;
                        //     intersects[0].point.y += intersects[0].face.normal.z * 0.01;
                        //     intersects[0].point.z += intersects[0].face.normal.y * 0.01;
                        //
                        //
                        //     pointArr.push(intersects[0].point)
                        //
                        //
                        //     INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                        //     INTERSECTED.material.emissive.setHex(0xff0000);
                        //
                        // } else {
                        //
                        //     intersects[0].point.x += intersects[0].face.normal.x * 0.01;
                        //     intersects[0].point.y += intersects[0].face.normal.z * 0.01;
                        //     intersects[0].point.z += intersects[0].face.normal.y * 0.01;
                        //
                        //     pointArr.push(intersects[0].point);
                        //
                        //
                        //
                        //
                        // }
                        //
                        // var sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);w
                        // var sphereMesh =  new THREE.Mesh(sphereGeo,new THREE.MeshPhongMaterial({ alphaTest: 0.5, ambient: 0xcccccc, color: 0xffffff, specular: 0x030303, side: THREE.DoubleSide}));
                        // sphereMesh.position.x = intersects2[0].point.x;
                        // sphereMesh.position.y = intersects2[0].point.y;
                        // sphereMesh.position.z = intersects2[0].point.z;
                        // // console.log(sphereMesh.position);
                        // scene.add(sphereMesh);
                        //
                        // spheres.push(sphereMesh);

                    }
                }}
            //     else {
            //     if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
            //
            //     INTERSECTED = null;
            //     pointArr=[];
            //
            //     for(var spN = 0;spN<spheres.length;spN++){
            //         scene.remove(spheres[spN])
            //     }
            //     spheres = [];
            //
            // }

        }

    })

    document.onkeydown=function(event){

        if(event.keyCode == 27){

            for(var groupNum = 0;groupNum<redrawGroup.length;groupNum++){

                scene.remove(redrawGroup[groupNum]);

            }
            redrawGroup=[];
            for(var spN = 0;spN<spheres.length;spN++){
                scene.remove(spheres[spN])
            }
            spheres = [];
            pointArr = [];

            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
            INTERSECTED = null;

        }
        if(event.keyCode==13){
            console.log("suc");
            if(pointArr.length>2) {
                var geo = new THREE.Geometry();

                var curve=new THREE.ClosedSplineCurve3(pointArr);

                geo.vertices = curve.getPoints(30);
                console.log(pointArr);
                for (var i = 0; i < 29; i++) {
                    geo.faces.push(new THREE.Face3(0, i + 1, i + 2));
                }


                //获取U的方向
                var uDirVec = new THREE.Vector3();
                uDirVec.subVectors(pointArr[1], pointArr[0]);
                uDirVec.normalize();
                //获取v的方向
                var vDirVec = new THREE.Vector3();
                vDirVec.subVectors(pointArr[2], pointArr[0]);
                //先计算面的法向量
                vDirVec.cross(uDirVec);
                //然后得到与面法线和U方向同时垂直的v的方向
                vDirVec.cross(uDirVec);
                vDirVec.normalize();
                var texture = THREE.ImageUtils.loadTexture(imageSrc, null, function(t){});
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set( 1, 1);

                for(var i=0; i<geo.faces.length; ++i){
                    var uvArray = [];
                    for(var j=0; j<3; ++j) {
                        var point;
                        if(j==0)
                            point = geo.vertices[geo.faces[i].a];
                        else if(j==1)
                            point = geo.vertices[geo.faces[i].b];
                        else
                            point = geo.vertices[geo.faces[i].c];

                        var tmpVec = new THREE.Vector3();
                        tmpVec.subVectors(point, pointArr[0]);

                        var u = tmpVec.dot(uDirVec);
                        var v = tmpVec.dot(vDirVec);

                        uvArray.push(new THREE.Vector2(u, v));
                    }
                    geo.faceVertexUvs[0].push(uvArray);
                }

                console.log(geo.faces);

                var mater = new THREE.MeshBasicMaterial({map:texture, side: THREE.DoubleSide});
                var p = new THREE.Mesh(geo, mater);
                p.name = currentBlcokName + "_p";
                scene.add(p);

                newDrawed.push(p);
                var index = newDrawed.indexOf(p);
                spherePoint[index] = [];

                var signal = new addedSignal(index);
                signal.mesh = p;
                signal.pointsArray= pointArr;


                var direction1 = [pointArr[0].x-pointArr[1].x,pointArr[0].y-pointArr[1].y,pointArr[0].z-pointArr[1].z];
                var direction2 = [pointArr[0].x-pointArr[2].x,pointArr[0].y-pointArr[2].y,pointArr[0].z-pointArr[2].z];

                signal.directionArr.push(direction1,direction2);


                for(var pN = 0;pN<spheres.length;pN++){
                    var mesh = spheres[pN];
                    spherePoint[index].push(mesh);
                    points.push(mesh);
                    signal.spheres.push(mesh);

                }
                signal.normal=intersects[0].face.normal;
                signals.push(signal);
            }else{
                pointArr=[];

                for(var spN = 0;spN<spheres.length;spN++){
                    scene.remove(spheres[spN])
                }
                spheres = [];
            }
            if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

            INTERSECTED = null;
            pointArr=[];
            spheres=[];

            for(var groupNum = 0;groupNum<redrawGroup.length;groupNum++){

                scene.remove(redrawGroup[groupNum]);

            }
            redrawGroup=[];
            for(var spN = 0;spN<spheres.length;spN++){
                scene.remove(spheres[spN])
            }
            spheres = [];
            pointArr = [];

            if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
            INTERSECTED = null;

        }

        if(event.keyCode==73) {

            //变化
            var currentSignal = signals[clickedNumber];  //得到对应的addedSignal对象
            var direction = currentSignal.directionArr[0];
            var mult = 0.01;

            clickedSphere.position.x+=direction[0]*mult;
            clickedSphere.position.y+=direction[1]*mult;
            clickedSphere.position.z+=direction[2]*mult;

            currentSignal.pointsArray[clickedIndex].x+=direction[0]*mult;   //得到对应的point坐标；
            currentSignal.pointsArray[clickedIndex].y+=direction[1]*mult;
            currentSignal.pointsArray[clickedIndex].z+=direction[2]*mult;

            var geo = new THREE.Geometry();

            var curve=new THREE.ClosedSplineCurve3(currentSignal.pointsArray);

            geo.vertices = curve.getPoints(30);

            for (var i = 0; i < 29; i++) {
                geo.faces.push(new THREE.Face3(0, i + 1, i + 2));
            }


            //获取U的方向
            var uDirVec = new THREE.Vector3();
            uDirVec.subVectors(currentSignal.pointsArray[1], currentSignal.pointsArray[0]);
            uDirVec.normalize();
            //获取v的方向
            var vDirVec = new THREE.Vector3();
            vDirVec.subVectors(currentSignal.pointsArray[2], currentSignal.pointsArray[0]);
            //先计算面的法向量
            vDirVec.cross(uDirVec);
            //然后得到与面法线和U方向同时垂直的v的方向
            vDirVec.cross(uDirVec);
            vDirVec.normalize();
            var texture = THREE.ImageUtils.loadTexture(imageSrc, null, function(t){});
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 1, 1);

            for(var i=0; i<geo.faces.length; ++i){
                var uvArray = [];
                for(var j=0; j<3; ++j) {
                    var point;
                    if(j==0)
                        point = geo.vertices[geo.faces[i].a];
                    else if(j==1)
                        point = geo.vertices[geo.faces[i].b];
                    else
                        point = geo.vertices[geo.faces[i].c];

                    var tmpVec = new THREE.Vector3();
                    tmpVec.subVectors(point, currentSignal.pointsArray[0]);

                    var u = tmpVec.dot(uDirVec);
                    var v = tmpVec.dot(vDirVec);

                    uvArray.push(new THREE.Vector2(u, v));
                }
                geo.faceVertexUvs[0].push(uvArray);
            }

            console.log(geo.faces);

            var mater = new THREE.MeshBasicMaterial({map:texture, side: THREE.DoubleSide});
            var p = new THREE.Mesh(geo, mater);
            p.name = currentBlcokName + "_p";
            scene.add(p);


            scene.remove(currentSignal.mesh)

            signals[clickedNumber].mesh = p;

        }
        if(event.keyCode==74) {
            console.log("j")

            var currentSignal = signals[clickedNumber];  //得到对应的addedSignal对象
            var direction = currentSignal.directionArr[1];
            var mult = 0.01;

            clickedSphere.position.x+=direction[0]*mult;
            clickedSphere.position.y+=direction[1]*mult;
            clickedSphere.position.z+=direction[2]*mult;

            currentSignal.pointsArray[clickedIndex].x+=direction[0]*mult;   //得到对应的point坐标；
            currentSignal.pointsArray[clickedIndex].y+=direction[1]*mult;
            currentSignal.pointsArray[clickedIndex].z+=direction[2]*mult;

            var geo = new THREE.Geometry();

            var curve=new THREE.ClosedSplineCurve3(currentSignal.pointsArray);

            geo.vertices = curve.getPoints(30);

            for (var i = 0; i < 29; i++) {
                geo.faces.push(new THREE.Face3(0, i + 1, i + 2));
            }


            //获取U的方向
            var uDirVec = new THREE.Vector3();
            uDirVec.subVectors(currentSignal.pointsArray[1], currentSignal.pointsArray[0]);
            uDirVec.normalize();
            //获取v的方向
            var vDirVec = new THREE.Vector3();
            vDirVec.subVectors(currentSignal.pointsArray[2], currentSignal.pointsArray[0]);
            //先计算面的法向量
            vDirVec.cross(uDirVec);
            //然后得到与面法线和U方向同时垂直的v的方向
            vDirVec.cross(uDirVec);
            vDirVec.normalize();
            var texture = THREE.ImageUtils.loadTexture(imageSrc, null, function(t){});
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 1, 1);

            for(var i=0; i<geo.faces.length; ++i){
                var uvArray = [];
                for(var j=0; j<3; ++j) {
                    var point;
                    if(j==0)
                        point = geo.vertices[geo.faces[i].a];
                    else if(j==1)
                        point = geo.vertices[geo.faces[i].b];
                    else
                        point = geo.vertices[geo.faces[i].c];

                    var tmpVec = new THREE.Vector3();
                    tmpVec.subVectors(point, currentSignal.pointsArray[0]);

                    var u = tmpVec.dot(uDirVec);
                    var v = tmpVec.dot(vDirVec);

                    uvArray.push(new THREE.Vector2(u, v));
                }
                geo.faceVertexUvs[0].push(uvArray);
            }

            console.log(geo.faces);

            var mater = new THREE.MeshBasicMaterial({map:texture, side: THREE.DoubleSide});
            var p = new THREE.Mesh(geo, mater);
            p.name = currentBlcokName + "_p";
            scene.add(p);


            scene.remove(currentSignal.mesh)

            signals[clickedNumber].mesh = p;


        }
        if(event.keyCode==75) {



            var currentSignal = signals[clickedNumber];  //得到对应的addedSignal对象
            var direction = currentSignal.directionArr[0];
            var mult = 0.01;

            clickedSphere.position.x-=direction[0]*mult;
            clickedSphere.position.y-=direction[1]*mult;
            clickedSphere.position.z-=direction[2]*mult;

            currentSignal.pointsArray[clickedIndex].x-=direction[0]*mult;   //得到对应的point坐标；
            currentSignal.pointsArray[clickedIndex].y-=direction[1]*mult;
            currentSignal.pointsArray[clickedIndex].z-=direction[2]*mult;

            var geo = new THREE.Geometry();

            var curve=new THREE.ClosedSplineCurve3(currentSignal.pointsArray);

            geo.vertices = curve.getPoints(30);

            for (var i = 0; i < 29; i++) {
                geo.faces.push(new THREE.Face3(0, i + 1, i + 2));
            }


            //获取U的方向
            var uDirVec = new THREE.Vector3();
            uDirVec.subVectors(currentSignal.pointsArray[1], currentSignal.pointsArray[0]);
            uDirVec.normalize();
            //获取v的方向
            var vDirVec = new THREE.Vector3();
            vDirVec.subVectors(currentSignal.pointsArray[2], currentSignal.pointsArray[0]);
            //先计算面的法向量
            vDirVec.cross(uDirVec);
            //然后得到与面法线和U方向同时垂直的v的方向
            vDirVec.cross(uDirVec);
            vDirVec.normalize();
            var texture = THREE.ImageUtils.loadTexture(imageSrc, null, function(t){});
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 1, 1);

            for(var i=0; i<geo.faces.length; ++i){
                var uvArray = [];
                for(var j=0; j<3; ++j) {
                    var point;
                    if(j==0)
                        point = geo.vertices[geo.faces[i].a];
                    else if(j==1)
                        point = geo.vertices[geo.faces[i].b];
                    else
                        point = geo.vertices[geo.faces[i].c];

                    var tmpVec = new THREE.Vector3();
                    tmpVec.subVectors(point, currentSignal.pointsArray[0]);

                    var u = tmpVec.dot(uDirVec);
                    var v = tmpVec.dot(vDirVec);

                    uvArray.push(new THREE.Vector2(u, v));
                }
                geo.faceVertexUvs[0].push(uvArray);
            }

            console.log(geo.faces);

            var mater = new THREE.MeshBasicMaterial({map:texture, side: THREE.DoubleSide});
            var p = new THREE.Mesh(geo, mater);
            p.name = currentBlcokName + "_p";
            scene.add(p);


            scene.remove(currentSignal.mesh)

            signals[clickedNumber].mesh = p;

        }
        if(event.keyCode==76) {
            console.log("l")

            var currentSignal = signals[clickedNumber];  //得到对应的addedSignal对象
            var direction = currentSignal.directionArr[1];
            var mult = 0.01;

            clickedSphere.position.x-=direction[0]*mult;
            clickedSphere.position.y-=direction[1]*mult;
            clickedSphere.position.z-=direction[2]*mult;

            currentSignal.pointsArray[clickedIndex].x-=direction[0]*mult;   //得到对应的point坐标；
            currentSignal.pointsArray[clickedIndex].y-=direction[1]*mult;
            currentSignal.pointsArray[clickedIndex].z-=direction[2]*mult;

            var geo = new THREE.Geometry();

            var curve=new THREE.ClosedSplineCurve3(currentSignal.pointsArray);

            geo.vertices = curve.getPoints(30);

            for (var i = 0; i < 29; i++) {
                geo.faces.push(new THREE.Face3(0, i + 1, i + 2));
            }


            //获取U的方向
            var uDirVec = new THREE.Vector3();
            uDirVec.subVectors(currentSignal.pointsArray[1], currentSignal.pointsArray[0]);
            uDirVec.normalize();
            //获取v的方向
            var vDirVec = new THREE.Vector3();
            vDirVec.subVectors(currentSignal.pointsArray[2], currentSignal.pointsArray[0]);
            //先计算面的法向量
            vDirVec.cross(uDirVec);
            //然后得到与面法线和U方向同时垂直的v的方向
            vDirVec.cross(uDirVec);
            vDirVec.normalize();
            var texture = THREE.ImageUtils.loadTexture(imageSrc, null, function(t){});
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 1, 1);

            for(var i=0; i<geo.faces.length; ++i){
                var uvArray = [];
                for(var j=0; j<3; ++j) {
                    var point;
                    if(j==0)
                        point = geo.vertices[geo.faces[i].a];
                    else if(j==1)
                        point = geo.vertices[geo.faces[i].b];
                    else
                        point = geo.vertices[geo.faces[i].c];

                    var tmpVec = new THREE.Vector3();
                    tmpVec.subVectors(point, currentSignal.pointsArray[0]);

                    var u = tmpVec.dot(uDirVec);
                    var v = tmpVec.dot(vDirVec);

                    uvArray.push(new THREE.Vector2(u, v));
                }
                geo.faceVertexUvs[0].push(uvArray);
            }

            console.log(geo.faces);

            var mater = new THREE.MeshBasicMaterial({map:texture, side: THREE.DoubleSide});
            var p = new THREE.Mesh(geo, mater);
            p.name = currentBlcokName + "_p";
            scene.add(p);


            scene.remove(currentSignal.mesh)

            signals[clickedNumber].mesh = p;


        }
        if(event.keyCode == 46){
            var currentSignal = signals[clickedNumber];  //得到对应的addedSignal对象

            currentSignal.spheres.splice(clickedIndex,1);
            currentSignal.pointsArray.splice(clickedIndex,1);
            scene.remove(clickedSphere);

            var geo = new THREE.Geometry();

            var curve=new THREE.ClosedSplineCurve3(currentSignal.pointsArray);

            geo.vertices = curve.getPoints(30);

            for (var i = 0; i < 29; i++) {
                geo.faces.push(new THREE.Face3(0, i + 1, i + 2));
            }


            //获取U的方向
            var uDirVec = new THREE.Vector3();
            uDirVec.subVectors(currentSignal.pointsArray[1], currentSignal.pointsArray[0]);
            uDirVec.normalize();
            //获取v的方向
            var vDirVec = new THREE.Vector3();
            vDirVec.subVectors(currentSignal.pointsArray[2], currentSignal.pointsArray[0]);
            //先计算面的法向量
            vDirVec.cross(uDirVec);
            //然后得到与面法线和U方向同时垂直的v的方向
            vDirVec.cross(uDirVec);
            vDirVec.normalize();
            var texture = THREE.ImageUtils.loadTexture(imageSrc, null, function(t){});
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 1, 1);

            for(var i=0; i<geo.faces.length; ++i){
                var uvArray = [];
                for(var j=0; j<3; ++j) {
                    var point;
                    if(j==0)
                        point = geo.vertices[geo.faces[i].a];
                    else if(j==1)
                        point = geo.vertices[geo.faces[i].b];
                    else
                        point = geo.vertices[geo.faces[i].c];

                    var tmpVec = new THREE.Vector3();
                    tmpVec.subVectors(point, currentSignal.pointsArray[0]);

                    var u = tmpVec.dot(uDirVec);
                    var v = tmpVec.dot(vDirVec);

                    uvArray.push(new THREE.Vector2(u, v));
                }
                geo.faceVertexUvs[0].push(uvArray);
            }

            console.log(geo.faces);

            var mater = new THREE.MeshBasicMaterial({map:texture, side: THREE.DoubleSide});
            var p = new THREE.Mesh(geo, mater);
            p.name = currentBlcokName + "_p";
            scene.add(p);


            scene.remove(currentSignal.mesh)

            signals[clickedNumber].mesh = p;

        }
    }

    function addedSignal(index){
        this.mesh  = null;
        this.spheres = [];
        this.normal = null;
        this.pointsArray = [];
        this.directionArr = [];
    }

    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth-200, window.innerHeight );

    }

	function computeRadius(point,camera){
        return Math.sqrt(Math.pow(point.x-camera.x,2)+Math.pow(point.y-camera.y,2)+Math.pow(point.z-camera.z,2))
    }
    $("#close").click(function(){

        $("#mask").removeClass("in")
//                $("#mask").css("display","none");
        setTimeout(function(){
            $("#mask").css("display","none");

        },1000)
        $("body,html").css({"overflow":"auto"})

    })
    $("#esc").click(function(){

        $("#mask").removeClass("in")
//                $("#mask").css("display","none");
        setTimeout(function(){
            $("#mask").css("display","none");

        },1000)
        $("body,html").css({"overflow":"auto"})

    })

    $("#cancel").click(function(){
        $("#triggerUI").removeClass("in")
        setTimeout(function(){
            $("#triggerUI").css("display","none");
        },10)
        $("body,html").css({"overflow":"auto"})

        isOnload = false;
        camControls.targetObject.position.set(backPosition.x,backPosition.y,backPosition.z);
        camControls.object.position.set(backPosition.x,backPosition.y,backPosition.z);
    })
    $("#triggerJump").click(function(){
        $("#triggerUI").removeClass("in")
        setTimeout(function(){
            $("#triggerUI").css("display","none");
        },10)
        $("body,html").css({"overflow":"auto"})

        $('.controller').children("button").css("backgroundColor","#ffffff");
        $('.controller').children("button").css("color","#000000");

        var showText = document.getElementById(triggerKey);
        showText.style.backgroundColor = "#00baff";
        showText.style.color = "white";

        preBlockName = currentBlcokName;
        destroyGroup();
        currentBlcokName = triggerKey;
        workerLoadVsg.postMessage(currentBlcokName);
        camControls.targetObject.position.set(jumpPosition.x,jumpPosition.y,jumpPosition.z);
    })


    function initStats() {

        var stats = new Stats();

        stats.setMode(0); // 0: fps, 1: ms

        // Align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';

        $("#Stats-output").append( stats.domElement );

        return stats;
    }

    $('.controller button').on('click',function(e){

        var btnClickedId = e.target.id;
        console.log(btnClickedId);

        if(currentBlcokName!=btnClickedId)
        {
            $('.controller').children("button").css("backgroundColor","#ffffff");
            $('.controller').children("button").css("color","#000000");

            var showText = document.getElementById(btnClickedId);
            showText.style.backgroundColor = "#00baff";
            showText.style.color = "white";

            isOnload = true;
            isJumpArea = true;
            preBlockName = currentBlcokName;
            currentBlcokName = btnClickedId;
            workerLoadVsg.postMessage(currentBlcokName);
            destroyGroup();
        }
    })


})

