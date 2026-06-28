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
	horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { totalDurationMs } from "../../videoEditorApi";

function formatMs(ms) {
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	const sec = s % 60;
	return `${m}:${String(sec).padStart(2, "0")}`;
}

function SortableFrameBlock({ frame, widthPx, isSelected, onSelect }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: frame.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		width: Math.max(48, widthPx),
		opacity: isDragging ? 0.85 : 1,
	};

	return (
		<button
			ref={setNodeRef}
			type="button"
			style={style}
			onClick={() => onSelect(frame.id)}
			className={`shrink-0 h-16 rounded-xl border-2 px-2 py-1.5 text-left transition-colors ${
				isSelected
					? "border-orange-500 bg-orange-50"
					: "border-zinc-200 bg-white hover:border-zinc-300"
			}`}
			{...attributes}
			{...listeners}
		>
			<p className="text-[10px] font-semibold text-zinc-800 truncate">{frame.name || frame.id}</p>
			<p className="text-[9px] text-zinc-400 font-mono mt-1">
				{formatMs(frame.duration_ms || 0)}
			</p>
		</button>
	);
}

export default function VideoEditorTimeline({
	frames,
	selectedFrameId,
	onSelectFrame,
	onReorder,
}) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const total = totalDurationMs(frames) || 1;
	const timelineWidth = Math.max(600, frames.length * 88);

	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = frames.findIndex((f) => f.id === active.id);
		const newIndex = frames.findIndex((f) => f.id === over.id);
		if (oldIndex < 0 || newIndex < 0) return;
		onReorder(arrayMove(frames, oldIndex, newIndex));
	};

	return (
		<div className="border border-zinc-200 rounded-xl bg-zinc-50 p-3 overflow-x-auto">
			<p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">
				Timeline · {formatMs(total)}
			</p>
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
				<SortableContext items={frames.map((f) => f.id)} strategy={horizontalListSortingStrategy}>
					<div className="flex gap-2" style={{ minWidth: timelineWidth }}>
						{frames.map((frame) => {
							const w = (frame.duration_ms / total) * timelineWidth;
							return (
								<SortableFrameBlock
									key={frame.id}
									frame={frame}
									widthPx={w}
									isSelected={selectedFrameId === frame.id}
									onSelect={onSelectFrame}
								/>
							);
						})}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
}
