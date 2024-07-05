
/**
 * Users who want to edit the invisible header inside of a Lurch document (which
 * is stored in its metadata) can do so in a second browser window (or tab)
 * containing a full Lurch document editor just for the header of the original
 * document.  In such a scheme, we call the first window (containing the whole
 * document) the *primary window* or *primary copy of the app* and the second
 * window (containing just the header from the primary window) *secondary
 * window* or *secondary copy of the app.*
 * 
 * This module adds features for both the primary and secondary copies of the
 * app.  For the primary window, it implements the tools for launching the
 * secondary window and sending it the header data.  For the secondary window,
 * it it implements the tools for limiting the UI elements to only what are
 * needed for the secondary copy of the app, and a function for passing the
 * edited header information back to the primary window upon request from the
 * user.
 * 
 * @module HeaderEditor
 */

import { appURL } from './utilities.js'
import { LurchDocument } from './lurch-document.js'
import { appSettings } from './settings-install.js'
import { Dialog, ButtonItem, ListItem, DialogRow, TextInputItem } from './dialog.js'
import { Dependency } from './dependencies.js'
import { Atom } from './atoms.js'
import { autoOpenLink, openFileInNewWindow } from './load-from-url.js'
import { FileSystem } from './file-system.js'

/**
 * The metadata element for a document is stored in the editor rather than the
 * DOM, because we do not want TinyMCE to be able to edit it.  It is sometimes
 * useful to be able to extract the header element from that metadata, so that
 * it can be treated like an entire document (fragment), since it effectively is
 * one.
 * 
 * @param {tinymce.Editor} editor - the editor from which to extract the
 *   document header
 * @returns {HTMLElement} the HTMLElement that contains the document header
 *   for this editor
 * @function
 */
export const getHeader = editor =>
    new LurchDocument( editor ).getMetadata( 'main', 'header' )

// For internal use only:  Extract the header from the document metadata, as a
// string of HTML
const getHeaderHTML = editor => {
    const result = getHeader( editor )
    return result ? result.innerHTML : ''
}
// For internal use only:  Save the given HTML text into the document metadata
// as the document's header
export const setHeader = ( editor, header ) =>
    new LurchDocument( editor ).setMetadata( 'main', 'header', 'html', header )

// Internal constant used in URL query strings to tell a copy of the app that it
// has been opened for the sole purpose of being a header editor for a different
// copy of the app.  If this shows up in the query string, then the Lurch app
// being launched knows to configure itself differently to support header
// editing rather than full document editing.  In particular, "Save" should send
// the header back to the original document, not save it as a new document.
const headerFlag = 'editHeader'

/**
 * Detect whether the current copy of the app running in this window is the
 * secondary one, created in service to another (primary) window elsewhere.
 * In other words, return true if this is the secondary window and false if it
 * is the primary one.
 * 
 * @returns {boolean} whether this app window is for editing the document
 *   header from a separate (primary) Lurch app window
 * @function
 */
export const isEditor = () =>
    new URL( window.location ).searchParams.get( headerFlag ) == 'true'

/**
 * Detect whether the current copy of the app running in this window is the
 * primary window *and also* currently has a secondary window open for editing
 * this window's header.
 * 
 * @returns {boolean} whether this app window has a secondary window open for
 *   editing the header in this window's document
 */
export const hasEditorOpen = () =>
    window.headerEditorWindow && !window.headerEditorWindow.closed

/**
 * Install into a TinyMCE editor instance the menu items that can be used in
 * the primary window to pop open the secondary window, or instead to move
 * content between the header and the main document.  The menu items in question
 * are intended for the Document menu, but could be placed anywhere.
 * 
 * @param {tinymce.editor} editor - the TinyMCE editor into which to install the
 *   tools
 * @function
 */
export const install = editor => {
    // Utility functions and global-ish variables for dependency preview searching
    const getPreviews = () => Atom.allIn( editor ).filter(
        atom => atom.getMetadata( 'type' ) == 'preview' )
    const previewExists = () => Atom.allIn( editor ).some(
        atom => atom.getMetadata( 'type' ) == 'preview' )
    let searchToolbar = null
    let searchBox = null
    let searchCounter = null
    let doSearch = null
    // Dependency preview search toolbar
    editor.once( 'PostRender', () => {
        // Install the toolbar and all of its elements
        searchBox = document.createElement( 'input' )
        searchBox.setAttribute( 'type', 'text' )
        searchBox.classList.add( 'search-input' )
        const searchLabel = document.createElement( 'p' )
        searchLabel.classList.add( 'search-label' )
        searchLabel.textContent = 'Search rules: '
        searchLabel.appendChild( searchBox )
        searchCounter = new Text( '' )
        searchLabel.appendChild( searchCounter )
        const searchGroup = document.createElement( 'div' )
        searchGroup.classList.add( 'tox-toolbar__group' )
        searchGroup.setAttribute( 'role', 'toolbar' )
        searchGroup.appendChild( searchLabel )
        searchToolbar = document.createElement( 'div' )
        searchToolbar.classList.add( 'tox-toolbar__overflow' )
        searchToolbar.classList.add( 'rule-search-toolbar' )
        searchToolbar.setAttribute( 'role', 'group' )
        searchToolbar.style.display = 'none'
        searchToolbar.appendChild( searchGroup )
        const toolbarParent = document.querySelector( '.tox-toolbar-overlord' )
        toolbarParent.appendChild( searchToolbar )
        // Define the search function
        doSearch = () => {
            const searchText = searchBox.value.toLowerCase()
            let numShown = 0
            const relevantText = rulenode => {
                // start with the text content of the rule
                let ans = rulenode.textContent
                // get the elements with data-metadata_latex or
                // data-metadata_lurchnotation attributes
                const lurchnodes = rulenode.querySelectorAll(
                    '[data-metadata_lurch-notation]')
                const texnodes = rulenode.querySelectorAll(
                    '[data-metadata_latex]')
                // concatenate all of their values 
                lurchnodes.forEach( x => ans += 
                    x.getAttribute('data-metadata_lurch-notation') )
                texnodes.forEach( x => ans += 
                    x.getAttribute('data-metadata_latex') )
                return ans.toLowerCase()
            }
            const showRecursive = node => {
                // Base case 1: The node is not an HTMLElement; ignore.
                if ( node.nodeType != Node.ELEMENT_NODE ) return
                // Base case 2: The node is a Rule atom; show iff filter applies.
                if ( Atom.isAtomElement( node )
                  && Atom.from( node, editor ).getMetadata( 'type' ) == 'rule' ) {
                    node.style.display = (
                        searchText == ''
                        || relevantText(node).includes( searchText )
                    ) ? '' : 'none'
                    numShown += node.style.display == '' ? 1 : 0
                    return
                }
                // Recursive case: Apply filter to all children, then show this
                // node iff the filter is empty or it contains a descendant that
                // was displayed as a rule that passed the filter.
                const numShownBefore = numShown
                Array.from( node.childNodes ).forEach( showRecursive )
                node.style.display = (
                    searchText == ''
                 || numShown > numShownBefore
                ) ? '' : 'none'
            }
            getPreviews().forEach( preview => showRecursive( preview.element ) )
            searchCounter.textContent = searchText == '' ? '' :
                                        numShown == 1 ? '1 rule found' :
                                        `${numShown} rules found`
        }
        // Install the search function
        searchBox.addEventListener( 'input', doSearch )
    } )
    // Whenever anything in the document changes (even the cursor position),
    // decide whether to show the search toolbar
    editor.on( 'input NodeChange Paste Change Undo Redo', () => {
        if ( searchToolbar ) {
            const show = previewExists()
            const wasShown = searchToolbar.style.display == ''
            searchToolbar.style.display = show ? '' : 'none'
            // If the toolbar just appeared, clear its search box
            if ( show && !wasShown ) {
                searchBox.value = ''
                doSearch()
            }
        }
    } )

    // Install all menu items related to headers and editing them
    editor.ui.registry.addMenuItem( 'editheader', {
        text : 'Edit document header in new window',
        icon : 'new-tab',
        tooltip : 'Edit document header',
        onAction : () => {
            if ( hasEditorOpen() )
                return Dialog.notify( editor, 'warning',
                    'You are already editing this document\'s header in another window.' )
            window.headerEditorWindow = window.open(
                `${appURL()}?${headerFlag}=true`, '_blank' )
            // We cannot tell when the header editor window is ready to receive
            // messages, so we have to retry sending our content until either it
            // lets us know that it received it, or the tab closes.
            const interval = setInterval( () => {
                if ( window.closed ) {
                    clearInterval( interval )
                    return
                }
                window.headerEditorWindow.postMessage(
                    getHeaderHTML( editor ), appURL() )
            }, 1000 )
            window.addEventListener( 'message', event => {
                if ( event.source != window.headerEditorWindow ) return
                // if it's a message saying they received our content, stop
                // trying to send it
                if ( event.data == 'content received' ) {
                    clearInterval( interval )
                    return
                }
                // otherwise, assume it's a "save" message with new content,
                // because the user edited the header in the other window and
                // then saved, which sends it back to us
                setHeader( editor, event.data )
                Dialog.notify( editor, 'success', 'Header updated from other window.', 5000 )
            }, false )
        }
    } )
    editor.ui.registry.addMenuItem( 'extractheader', {
        text : 'Move header into document',
        icon : 'chevron-down',
        tooltip : 'Extract header to top of document',
        onAction : () => {
            if ( hasEditorOpen() )
                return Dialog.notify( editor, 'error',
                    'You cannot extract the header while editing it in another window.' )
            const header = getHeaderHTML( editor )
            if ( header == '' )
                return Dialog.notify( editor, 'warning',
                    'This document\'s header is currently empty.' )
            appSettings.load()
            appSettings.showWarning( 'warn before extract header', editor )
            .then( userSaidToProceed => {
                if ( !userSaidToProceed ) return
                editor.selection.setCursorLocation() // == start
                editor.insertContent( header )
                setHeader( editor, '' )
                editor.undoManager.clear()
            } )
        }
    } )
    editor.ui.registry.addMenuItem( 'embedheader', {
        text : 'Move selection to end of header',
        icon : 'chevron-up',
        tooltip : 'Embed selection from document to end of header',
        onAction : () => {
            if ( hasEditorOpen() )
                return Dialog.notify( editor, 'error',
                    'You cannot extract the header while editing it in another window.' )
            const toEmbed = editor.selection.getContent()
            if ( hasEditorOpen() )
                return Dialog.notify( editor, 'error',
                    'You do not currently have any content selected.' )
            appSettings.load()
            appSettings.showWarning( 'warn before embed header', editor )
            .then( userSaidToProceed => {
                if ( !userSaidToProceed ) return
                setHeader( editor, getHeaderHTML( editor ) + toEmbed )
                editor.execCommand( 'delete' )
                editor.undoManager.clear()
            } )
        }
    } )
    editor.ui.registry.addMenuItem( 'editdependencyurls', {
        text : 'Edit background material',
        tooltip : 'Edit the list of documents on which this one depends',
        icon : 'edit-block',
        onAction : () => {
            // Get all dependencies from the document
            let header = getHeader( editor ) // NOTE! this is a clone!
            const dependencies = !header ? [ ] :
                Dependency.topLevelDependenciesIn( header, editor ).map( atom => {
                    return {
                        filename : atom.getMetadata( 'filename' ),
                        dynamic : atom.getMetadata( 'autoRefresh' )
                    }
                } )
            // Create the dialog, but do not populate it with dependencies yet.
            const dialog = new Dialog( 'Edit background material', editor )
            dialog.json.size = 'medium'
            const listItem = new ListItem( 'dependencies' )
            listItem.setSelectable()
            listItem.onSelectionChanged = () => {
                dialog.dialog.setEnabled( 'View', !!listItem.selectedItem )
                dialog.dialog.setEnabled( 'Remove', !!listItem.selectedItem )
            }
            dialog.addItem( listItem )
            const staticButton = new ButtonItem( 'Add static' )
            const dynamicButton = new ButtonItem( 'Add dynamic' )
            const viewButton = new ButtonItem( 'View' )
            const removeButton = new ButtonItem( 'Remove' )
            dialog.addItem( new DialogRow(
                staticButton, dynamicButton, viewButton, removeButton ) )
            // Define what happens when the dialog is closed, then show it
            dialog.show().then( userHitOK => {
                if ( !userHitOK ) return
                // Ensure the document has a header, even if it's empty.
                if ( !header ) {
                    setHeader( editor, '' )
                    header = getHeader( editor )
                }
                // (NOTE: At this point, "header" is a CLONE of the actual
                // document header, so changes made to it do NOT update the doc.)
                // Remove all dependencies from the header (clone):
                Dependency.topLevelDependenciesIn( header, editor ).forEach(
                    atom => atom.element.remove() )
                // Add new dependencies to the end of the header (clone),
                // representing the current contents of this dialog:
                dependencies.forEach( dependency => {
                    const newDependency = Atom.newBlock( editor, '', {
                        type : 'dependency',
                        description : 'none',
                        filename : dependency.filename,
                        source : dependency.fileSystem || 'the web',
                        autoRefresh : dependency.dynamic
                    } )
                    if ( dependency.contents )
                        newDependency.setHTMLMetadata( 'content', dependency.contents )
                    newDependency.update()
                    header.appendChild( newDependency.element )
                } )
                // Now use that header clone we've been editing to change the
                // actual document header for real:
                setHeader( editor, header.innerHTML )
                // Now use a bit of a hack (the private method findMetadataElement())
                // to find the dependency atoms inside the header, to refresh them.
                const savedHeader = new LurchDocument( editor )
                    .findMetadataElement( 'main', 'header' )
                // Refresh any dependency that is marked as web-based and auto-refresh:
                Dependency.refreshAllIn( savedHeader, true ).then( () => {
                    Dialog.notify( editor, 'success',
                        'Reloaded any web-based background material.',
                        5000 )
                } ).catch( error => {
                    Dialog.notify( editor, 'error',
                        'Failed to reload some web-based background material.' )
                    console.log( 'Error when refreshing background material',
                        error )
                } )
            } )
            // Now define a function that will populate it with dependencies.
            const updateList = () => {
                // If there are no dependencies, print a special "empty" message.
                if ( dependencies.length == 0 ) {
                    const message = 'No background material defined yet.'
                    listItem.showText(
                        `<span style="color:gray;">${message}</span>` )
                    return
                }
                // If there are dependencies, show each with all its info.
                listItem.showList( dependencies.map( dependency => {
                    return `${dependency.filename} (${dependency.dynamic ? 'dynamic' : 'static'})`
                } ), dependencies )
            }
            updateList()
            // Add actions to all buttons in dialog
            dynamicButton.action = () => {
                const urlDialog = new Dialog( 'Add dynamic background document',
                    editor )
                urlDialog.addItem( new TextInputItem(
                    'url',
                    'URL for background document',
                    'http://www.example.com/mydoc.lurch'
                ) )
                urlDialog.show().then( userHitOK => {
                    if ( !userHitOK ) return
                    const url = urlDialog.get( 'url' )
                    if ( url == '' ) return
                    dependencies.push( { filename : url, dynamic : true } )
                    updateList()
                } )
            }
            staticButton.action = () => {
                FileSystem.openFile( editor, document => {
                    if ( !document ) return
                    dependencies.push( {
                        filename : document.filename,
                        source : document.fileSystem,
                        contents : document.contents,
                        dynamic : false
                    } )
                    updateList()
                } )
            }
            viewButton.action = () => {
                const dependency = listItem.selectedItem
                if ( dependency.dynamic )
                    window.open( autoOpenLink( dependency.filename ), '_blank' )
                else if ( dependency.contents )
                    openFileInNewWindow( dependency.contents )
                else
                    console.error( 'No contents in dependency: ' + dependency )
            }
            removeButton.action = () => {
                const dependency = listItem.selectedItem
                dependencies.splice( dependencies.indexOf( dependency ), 1 )
                updateList()
            }
        }
    } )
    editor.ui.registry.addMenuItem( 'viewdependencyurls', {
        text : 'Show/Hide rules',
        icon : 'character-count',
        shortcut : 'meta+alt+0',
        tooltip : 'View the mathematical content on which this document depends',
        onAction : () => {
            // If there are preview atoms in the document, remove them and be done
            const existingPreviews = getPreviews()
            if ( existingPreviews.length > 0 ) {
                existingPreviews.forEach( preview => preview.element.remove() )
                editor.selection.setCursorLocation( editor.getBody(), 0 )
                // Also, if we have a cursor location stored from before we
                // showed this preview, put the user's cursor location back
                // there for convenience.  (See more comments on this below.)
                if ( editor.selectionBeforePreview ) {
                    editor.selection.setRng( editor.selectionBeforePreview )
                    editor.selectionBeforePreview = null
                    editor.selection.getStart()?.scrollIntoView()
                }
                return
            }
            // If not, we have to create them from the content in the header.
            // If there is no content in the header, report that and be done.
            const header = getHeader( editor )
            if ( !header ) {
                Dialog.notify( editor, 'warning',
                    'This document does not import any background material.',
                    5000 )
                return
            }
            // Accumulate the HTML representation of all previews of all
            // dependencies in the header.
            let allPreviewHTML = ''
            Dependency.topLevelDependenciesIn( header ).forEach( dependency => {
                const preview = Atom.newBlock( editor, '', { type : 'preview' } )
                preview.imitate( dependency )
                allPreviewHTML += preview.element.outerHTML
            } )
            // Remember where the user's cursor was before we insert the preview,
            // because it may be large and require them to scroll to see it.
            // If they then hide it, it's nice to jump back to where they were.
            editor.selectionBeforePreview = editor.selection.getRng()
            // Insert it into the document.
            editor.selection.setCursorLocation() // == start
            editor.insertContent( allPreviewHTML )
            editor.undoManager.clear()
            editor.selection.setCursorLocation() // deselect new insertions
        }
    } )
}

/**
 * Assuming that we're in the secondary copy of the app, listen for the message
 * from the primary window that sends us the header to edit, and when we receive
 * it, populate our editor with it.  While we wait, our editor is read only and
 * says "Loading header..." so that the user knows to wait.
 * 
 * Also, install a new File > Save action that will send our editor's content
 * back to the primary window so that it can store that updated content in its
 * document header.
 * 
 * @param {tinymce.editor} editor - the TinyMCE editor into which to load the
 *   header data, once we receive it from the primary window
 * @function
 */
export const listen = editor => {
    let mainEditor = null
    editor.setContent( 'Loading header...' )
    editor.mode.set( 'readonly' )
    window.addEventListener( 'message', event => {
        if ( !appURL().startsWith( event.origin ) ) return
        mainEditor = event.source
        new LurchDocument( editor ).newDocument()
        editor.setContent( event.data )
        editor.mode.set( 'design' )
        Dialog.notify( editor, 'success',
            'Opened header data for editing.\nDon\'t forget to save before closing.' )
        mainEditor.postMessage( 'content received', appURL() )
    }, false )
    editor.ui.registry.addMenuItem( 'savedocument', {
        text : 'Save',
        tooltip : 'Save header into original document',
        icon : 'save',
        shortcut : 'meta+S',
        onAction : () => {
            if ( !mainEditor ) return
            mainEditor.postMessage( editor.getContent(), appURL() )
        }
    } )
}

export default { isEditor, hasEditorOpen, install, listen }
