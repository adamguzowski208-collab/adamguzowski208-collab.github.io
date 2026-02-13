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
        palette=[[255,0,0],[255,120,0],[255,200,0]];
    }

    if(style==="ice"){
        palette=[[0,80,255],[0,180,255],[255,255,255]];
    }

    if(style==="shadow"){
        palette=[[0,0,0],[60,60,60],[160,160,160],[255,255,255]];
    }

    if(style==="toxic"){
        palette=[[0,60,0],[0,180,0],[120,255,0],[255,255,0]];
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

    const scale=1;
    const baseHeight=2;
    const reliefHeight=1;

    const canvas=document.createElement("canvas");
    const ctx=canvas.getContext("2d");
    canvas.width=img.width;
    canvas.height=img.height;
    ctx.drawImage(img,0,0);

    const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;

    let stl="solid skin\n";

    function quad(v1,v2,v3,v4){
        stl+="facet normal 0 0 0\n outer loop\n";
        stl+=`  vertex ${v1}\n  vertex ${v2}\n  vertex ${v3}\n`;
        stl+=" endloop\nendfacet\n";

        stl+="facet normal 0 0 0\n outer loop\n";
        stl+=`  vertex ${v1}\n  vertex ${v3}\n  vertex ${v4}\n`;
        stl+=" endloop\nendfacet\n";
    }

    const w=img.width*scale;
    const h=img.height*scale;
    const d=baseHeight;

    // baza (jedna bryła)
    quad(`0 0 0`,`${w} 0 0`,`${w} ${h} 0`,`0 ${h} 0`);
    quad(`0 0 ${d}`,`0 ${h} ${d}`,`${w} ${h} ${d}`,`${w} 0 ${d}`);
    quad(`0 0 0`,`0 0 ${d}`,`${w} 0 ${d}`,`${w} 0 0`);
    quad(`0 ${h} 0`,`${w} ${h} 0`,`${w} ${h} ${d}`,`0 ${h} ${d}`);
    quad(`0 0 0`,`0 ${h} 0`,`0 ${h} ${d}`,`0 0 ${d}`);
    quad(`${w} 0 0`,`${w} 0 ${d}`,`${w} ${h} ${d}`,`${w} ${h} 0`);

    // relief jako jedna górna siatka
    for(let y=0;y<img.height;y++){
        for(let x=0;x<img.width;x++){

            const i=(y*img.width+x)*4;
            if(data[i+3]===0) continue;

            const x0=x*scale;
            const y0=y*scale;
            const x1=(x+1)*scale;
            const y1=(y+1)*scale;
            const z=baseHeight+reliefHeight;

            quad(
                `${x0} ${y0} ${z}`,
                `${x1} ${y0} ${z}`,
                `${x1} ${y1} ${z}`,
                `${x0} ${y1} ${z}`
            );
        }
    }

    stl+="endsolid skin";

    const blob=new Blob([stl],{type:"text/plain"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download="skin_relief_fixed.stl";
    link.click();
}

