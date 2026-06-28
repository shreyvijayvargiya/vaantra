import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

function formatMs(ms) {
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${m}:${String(sec).padStart(2, "0")}`;
}

function SortableFrameRow({ frame, isSelected, onSelect, isPlaying }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: frame.id });

	return (
		<button
			ref={setNodeRef}
			type="button"
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.85 : 1,
			}}
			onClick={() => onSelect(frame.id)}
			className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-colors ${
				isSelected
					? "border-orange-500 bg-orange-50"
					: "border-zinc-200 bg-white hover:border-zinc-300"
			} ${isPlaying ? "ring-2 ring-orange-300 ring-offset-1" : ""}`}
		>
			<span
				className="touch-none text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing"
				{...attributes}
				{...listeners}
				onClick={(e) => e.stopPropagation()}
			>
				<GripVertical className="w-3.5 h-3.5" />
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-xs font-semibold text-zinc-800 truncate">
					{frame.name || frame.id}
				</p>
				<p className="text-[10px] text-zinc-400 font-mono">
					{frame.visual_type || "frame"} · {formatMs(frame.duration_ms || 0)}
				</p>
			</div>
		</button>
	);
}

export default function VideoEditorFrameList({
	frames,
	selectedFrameId,
	playingFrameId,
	onSelectFrame,
	onReorder,
}) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = frames.findIndex((f) => f.id === active.id);
		const newIndex = frames.findIndex((f) => f.id === over.id);
		if (oldIndex < 0 || newIndex < 0) return;
		onReorder(arrayMove(frames, oldIndex, newIndex));
	};

	return (
		<div className="space-y-2">
			<p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-0.5">
				Frames ({frames.length})
			</p>
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
				<SortableContext items={frames.map((f) => f.id)} strategy={verticalListSortingStrategy}>
					<div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-0.5">
						{frames.map((frame) => (
							<SortableFrameRow
								key={frame.id}
								frame={frame}
								isSelected={selectedFrameId === frame.id}
								isPlaying={playingFrameId === frame.id}
								onSelect={onSelectFrame}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
}
