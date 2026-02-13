let img;

function loadSkin(){
    const file=document.getElementById("fileInput").files[0];
    if(!file) return;

    const reader=new FileReader();
    reader.onload=function(e){
        const image=new Image();
        image.onload=function(){
            img=image;
            document.getElementById("preview").src=e.target.result;
        }
        image.src=e.target.result;
    }
    reader.readAsDataURL(file);
}

function applyStyle(style){
    if(!img) return alert("Najpierw wrzuć skina!");

    const canvas=document.createElement("canvas");
    const ctx=canvas.getContext("2d");
    canvas.width=img.width;
    canvas.height=img.height;
    ctx.drawImage(img,0,0);

    const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
    const data=imageData.data;

    let palette;

    if(style==="lava"){
        palette=[
            [255,0,0],
            [255,120,0],
            [255,200,0]
        ];
    }

    if(style==="ice"){
        palette=[
            [0,80,255],
            [0,180,255],
            [255,255,255]
        ];
    }

    if(style==="shadow"){
        palette=[
            [0,0,0],
            [60,60,60],
            [160,160,160],
            [255,255,255]
        ];
    }

    if(style==="toxic"){
        palette=[
            [0,60,0],
            [0,180,0],
            [120,255,0],
            [255,255,0]
        ];
    }

    for(let i=0;i<data.length;i+=4){
        if(data[i+3]===0) continue;

        const brightness=(data[i]+data[i+1]+data[i+2])/3;
        const index=Math.floor((brightness/256)*palette.length);
        const color=palette[index];

        data[i]=color[0];
        data[i+1]=color[1];
        data[i+2]=color[2];
    }

    ctx.putImageData(imageData,0,0);
    document.getElementById("preview").src=canvas.toDataURL();
}

function exportSTL(){
    if(!img) return alert("Najpierw wrzuć skina!");

    const pixelSize=1;
    const baseHeight=2;
    const pixelHeight=1;

    const canvas=document.createElement("canvas");
    const ctx=canvas.getContext("2d");
    canvas.width=img.width;
    canvas.height=img.height;
    ctx.drawImage(img,0,0);

    const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;

    let triangles=[];

    function addQuad(v1,v2,v3,v4){
        triangles.push([v1,v2,v3]);
        triangles.push([v1,v3,v4]);
    }

    function addCube(x,y,z,w,h,d){
        const v=[
            [x,y,z],
            [x+w,y,z],
            [x+w,y+h,z],
            [x,y+h,z],
            [x,y,z+d],
            [x+w,y,z+d],
            [x+w,y+h,z+d],
            [x,y+h,z+d]
        ];

        addQuad(v[0],v[1],v[2],v[3]);
        addQuad(v[4],v[5],v[6],v[7]);
        addQuad(v[0],v[4],v[7],v[3]);
        addQuad(v[1],v[5],v[6],v[2]);
        addQuad(v[3],v[2],v[6],v[7]);
        addQuad(v[0],v[1],v[5],v[4]);
    }

    addCube(0,0,0,img.width*pixelSize,img.height*pixelSize,baseHeight);

    for(let y=0;y<img.height;y++){
        for(let x=0;x<img.width;x++){
            const i=(y*img.width+x)*4;
            if(data[i+3]===0) continue;

            addCube(
                x*pixelSize,
                y*pixelSize,
                baseHeight,
                pixelSize,
                pixelSize,
                pixelHeight
            );
        }
    }

    let stl="solid skin\n";

    triangles.forEach(tri=>{
        stl+="facet normal 0 0 0\n outer loop\n";
        tri.forEach(v=>{
            stl+=`  vertex ${v[0]} ${v[1]} ${v[2]}\n`;
        });
        stl+=" endloop\nendfacet\n";
    });

    stl+="endsolid skin";

    const blob=new Blob([stl],{type:"text/plain"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download="skin_relief.stl";
    link.click();
}
