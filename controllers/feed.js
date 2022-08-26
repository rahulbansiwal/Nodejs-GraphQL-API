const {validationResult}= require('express-validator');
const Post = require('../models/post');
const User= require('../models/user');
const io= require('../socket');



exports.getPosts= async (req,res,next)=>{
    const currentPage= req.query.page||1;
    const perPage=2;
    try{
    const totalItems = await Post.find().countDocuments()
    const posts= await Post.find().skip((currentPage-1)*perPage).limit(perPage);
    
        res.status(200).json({
            message : 'fetched Posts',
            posts:posts,
            totalItems : totalItems
        })
    }
    catch(err){
        if(!err.statusCode){
            err.statusCode =500;
        }
        next(err);
    }
    
};

exports.createPost = (req,res,next)=>{
    const errors= validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    console.log('requestBody',req.userId); 
    const post = new Post({
        title :title,
        content : content,
        creator: req.userId
    });
    post.save()
    .then(result=>{
        return User.findById(req.userId);
    })
    .then(user=>{
        creator= user;
        user.posts.push(post);
        return user.save()
    })
    .then(result=>{
        io.getIO().emit('posts',{
            action : 'create',
            post:post
        });
        res.status(201).json(
            {

                message:'Post created succesfully!',
                post: post,
                creator:{_id:creator._id,name:creator.name}
    });
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode =500;
        }
        next(err);
    });
    
};

exports.getPost =  (req,res,next)=>{
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post=>{
        if(!post){
            const error= new Error('post not found');
            error.statusCode=404;
            throw error;
        }
        res.status(200).json({
            message : "Post Fetched",
            post:post
        });
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode =500;
        }
        next(err);
    })
};


exports.updatePost = (req,res,next)=>{
    const errors= validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed');
        error.statusCode = 422;
        throw error;
    }
    const postId = req.params.postId;
    const title = req.body.title;
    const content= req.body.content;
    // if(!imageUrl){
    //     const error = new Error('No file Picked');
    //     error.statusCode = 422;
    //     throw error;
    // }
    Post.findById(postId)
    .then(post=>{
        if(!post){
            const error= new Error('post not found');
            error.statusCode=404;
            throw error;
        }
        console.log(req.userId);
        if(post.creator.toString()!==req.userId){
            const error = new Error('Invalid User');
            error.statusCode= 403;
            throw error;
        }
        post.title= title;
        //post.imageUrl = imageUrl;
        post.content = content;
        return post.save()
    })
    .then(result=>{
        res.status(200).json({
            messages:'Post Updated!',
            post:result
        })
    })
    .catch(err=>{
        if(!err.statusCode){
            err.statusCode =500;
        }
        next(err);
    })
}

exports.deletePost= (req,res,next)=>{
    const postId= req.params.postId;
    console.log(postId);
    Post.findById(postId)
        .then(post=>{
            //check logged user
            if(!post){
                const error= new Error('post not found');
                error.statusCode=404;
                throw error;
            }
            if(post.creator.toString()!==req.userId){
                const error = new Error('Invalid User');
                error.statusCode= 403;
                throw error;
            }
            return Post.findByIdAndRemove(postId);
        })
        .then(result=>{
            return User.findById(req.userId);
        })
        .then(user=>{
            user.posts.pull(postId);
            return user.save();
        })
        .then(result=>{
            console.log(result);
           res.status(200).json({
            message:"post deleted succesfully"
           }) 
        })
        .catch(err=>{
            if(!err.statusCode){
                err.statusCode =500;
            }
            next(err);
        })
}