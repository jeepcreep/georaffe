"use client";

import { Button, Modal, Label, TextInput, Textarea } from "flowbite-react";
import { useState } from "react";

export default function AddMarkerModal({ show, onClose, onSave, position }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        // Ensure position is valid
        if (position) {
            await onSave({ lat: position.lat, lng: position.lng, title, description, link });
        }
        setIsSaving(false);
        // Reset form
        setTitle('');
        setDescription('');
        setLink('');
        onClose();
    }

    return (
        <Modal show={show} onClose={onClose} size="md" popup>
            <Modal.Header>Add Marker</Modal.Header>
            <Modal.Body>
                <div className="space-y-6">
                    <form onSubmit={handleSave} className="flex flex-col gap-4">
                        <div>
                            <Label htmlFor="marker-title" value="Title" />
                            <TextInput 
                                id="marker-title" 
                                placeholder="e.g. Old City Hall"
                                required 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                            />
                        </div>
                        <div>
                            <Label htmlFor="marker-desc" value="Description (Optional)" />
                            <Textarea 
                                id="marker-desc" 
                                placeholder="What's interesting here?"
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                rows={3} 
                            />
                        </div>
                        <div>
                            <Label htmlFor="marker-link" value="External Link (Optional)" />
                            <TextInput 
                                id="marker-link" 
                                type="url" 
                                placeholder="https://example.com/info" 
                                value={link} 
                                onChange={(e) => setLink(e.target.value)} 
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                             <Button color="gray" onClick={onClose}>Cancel</Button>
                             <Button type="submit" isProcessing={isSaving}>Save Marker</Button>
                        </div>
                    </form>
                </div>
            </Modal.Body>
        </Modal>
    )
}
