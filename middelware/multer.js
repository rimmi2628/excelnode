const multer=require('multer');



const multerstorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"public");
    },
    filename:(req,file,cb)=>{
        const ext=file.mimetype.split("/")[1];
        cb(null,`${file.fieldname}-${Date.now()}.${ext}`);
    },
});
const upload=multer({
    storage:multerstorage
});

module.exports=upload;