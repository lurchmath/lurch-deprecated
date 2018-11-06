var EventEmitter,Feedback,InputStructure,InputTree,Structure,deserializeIfNeeded,expectedArgumentCount,feedback,functions,isInTheInputTree,hasProp={}.hasOwnProperty,slice=[].slice,indexOf=[].indexOf||function(e){for(var t=0,r=this.length;t<r;t++)if(t in this&&this[t]===e)return t;return-1};"undefined"!=typeof require&&null!==require?(Structure=require("./structure").Structure,InputStructure=require("./input-structure").InputStructure):"undefined"!=typeof WorkerGlobalScope&&null!==WorkerGlobalScope?(importScripts("structure.js"),importScripts("input-structure.js")):null!=("undefined"!=typeof self&&null!==self?self.importScripts:void 0)&&(importScripts("release/structure.js"),importScripts("release/input-structure.js")),(InputTree=(new InputStructure).attr({id:"root"})).trackIDs(),(functions={}).getInputTree=function(){return InputTree},isInTheInputTree=function(e){for(;e instanceof InputStructure;){if(e===InputTree)return!0;e=e.parent()}return!1},deserializeIfNeeded=function(e){return e instanceof InputStructure?e:Structure.fromJSON(e)},functions.insertStructure=function(e,t,r){var n,u,i,c;if(null!=(c=Structure.instanceWithID(t))&&0<=r&&r<=c.children().length&&isInTheInputTree(c)&&null!=(i=deserializeIfNeeded(e))&&i instanceof InputStructure)return(n=function(){var e,t;e=i.attributes,t=[];for(u in e)hasProp.call(e,u)&&"_"===u[0]&&t.push(u);return t}()).length>0&&i.clearAttributes.apply(i,n),c.insertChild(i,r),i.trackIDs()},functions.deleteStructure=function(e){var t;if(null!=(t=Structure.instanceWithID(e))&&isInTheInputTree(t)&&t!==InputTree)return t.removeFromParent(),t.untrackIDs()},functions.replaceStructure=function(e,t){var r,n,u,i;if(null!=(i=Structure.instanceWithID(e))&&isInTheInputTree(i)&&i!==InputTree&&null!=(u=deserializeIfNeeded(t))&&u instanceof InputStructure)return(r=function(){var e,t;e=u.attributes,t=[];for(n in e)hasProp.call(e,n)&&"_"===n[0]&&t.push(n);return t}()).length>0&&u.clearAttributes.apply(u,r),i.replaceWith(u),i.untrackIDs(),u.trackIDs()},functions.setStructureAttribute=function(e,t,r){var n;if("_"!==t[0])return null!=(n=Structure.instanceWithID(e))&&isInTheInputTree(n)&&("id"===t&&n.untrackIDs(!1),void 0===r?n.clearAttributes(t):n.setAttribute(t,r),"id"===t)?n.trackIDs(!1):void 0},functions.insertConnection=function(e,t,r){var n,u;return!!((n=Structure.instanceWithID(e))&&(u=Structure.instanceWithID(t))&&isInTheInputTree(n)&&isInTheInputTree(u))&&Structure.connect(n,u,r)},functions.removeConnection=function(e){return!(!isInTheInputTree(Structure.getConnectionSource(e))||!isInTheInputTree(Structure.getConnectionTarget(e)))&&Structure.disconnect(e)},functions.setConnectionAttribute=function(e,t,r){return!(!isInTheInputTree(Structure.getConnectionSource(e))||!isInTheInputTree(Structure.getConnectionTarget(e)))&&Structure.setConnectionData(e,t,r)},("undefined"!=typeof WorkerGlobalScope&&null!==WorkerGlobalScope||null!=("undefined"!=typeof self&&null!==self?self.importScripts:void 0))&&(expectedArgumentCount={insertStructure:[3],deleteStructure:[1],replaceStructure:[2],setStructureAttribute:[2,3],insertConnection:[3],removeConnection:[1],setConnectionAttribute:[2,3],getInputTree:[0]},self.addEventListener("message",function(e){var t,r,n,u,i,c,s,o;if(i=e.data,r=i[0],t=2<=i.length?slice.call(i,1):[],c=t.length,indexOf.call(null!=(s=expectedArgumentCount[r])?s:[],c)>=0&&("getInputTree"===r?self.postMessage({type:"getInputTree",payload:functions.getInputTree().toJSON()}):functions[r].apply(functions,t)),"sendFeedback"===r)return u=t[0],n=t[1],null!=(null!=(o=Structure.instanceWithID(u))?o.feedback:void 0)?o.feedback(n):self.postMessage("No such Structure: "+u)})),"undefined"!=typeof window&&null!==window&&"undefined"!=typeof EventTarget&&null!==EventTarget&&(Feedback=window.Feedback=new EventTarget),"undefined"!=typeof require&&null!==require&&"undefined"!=typeof exports&&null!==exports&&(EventEmitter=require("events"),(Feedback=exports.Feedback=new EventEmitter).addEventListener=Feedback.addListener),feedback=function(e){var t;return null!=(null!=Feedback?Feedback.dispatchEvent:void 0)?(t=new Event("feedback"),t.data=e,Feedback.dispatchEvent(t)):null!=(null!=Feedback?Feedback.emit:void 0)?Feedback.emit("feedback",e):null!=("undefined"!=typeof self&&null!==self?self.postMessage:void 0)?self.postMessage({type:"feedback",payload:e}):void 0},Structure.feedback=feedback,"undefined"!=typeof exports&&null!==exports&&(exports.Structure=Structure,exports.InputStructure=InputStructure,exports.insertStructure=functions.insertStructure,exports.deleteStructure=functions.deleteStructure,exports.replaceStructure=functions.replaceStructure,exports.setStructureAttribute=functions.setStructureAttribute,exports.getInputTree=functions.getInputTree);
//# sourceMappingURL=lde.js.map
