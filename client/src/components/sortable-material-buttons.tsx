import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';

interface MaterialType {
  id: string;
  name: string;
  color: string;
}

interface SortableMaterialButtonsProps {
  materialTypes: MaterialType[];
  selectedMaterialTypeId?: string;
  onMaterialTypeSelect: (materialTypeId?: string) => void;
  isMobile?: boolean;
}

interface SortableButtonProps {
  type: MaterialType;
  isSelected: boolean;
  onSelect: () => void;
  isMobile?: boolean;
}

function SortableButton({ type, isSelected, onSelect, isMobile }: SortableButtonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: type.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="relative inline-flex items-center group"
    >
      <Button
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          console.log('Material button clicked:', type.name);
          onSelect();
        }}
        style={isSelected ? { backgroundColor: type.color } : {}}
        className={`rounded-full shrink-0 pr-6 ${isSelected 
          ? "text-white" 
          : "text-gray-600 border-gray-300 hover:bg-gray-50"
        }`}
      >
        {type.name}
      </Button>
      
      {/* ドラッグハンドル - ボタンの右端に配置 */}
      <div
        {...listeners}
        className="absolute right-1 top-1/2 transform -translate-y-1/2 w-4 h-4 cursor-move opacity-30 group-hover:opacity-70 flex items-center justify-center text-xs"
        title="ドラッグして並び替え"
        style={{ color: isSelected ? 'white' : '#666' }}
      >
        ⋮⋮
      </div>
    </div>
  );
}

export function SortableMaterialButtons({ 
  materialTypes, 
  selectedMaterialTypeId, 
  onMaterialTypeSelect,
  isMobile = false 
}: SortableMaterialButtonsProps) {
  const [items, setItems] = useState<MaterialType[]>(materialTypes);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // ローカルストレージから並び順を復元
    const savedOrder = localStorage.getItem('materialTypeOrder');
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        const orderedItems = orderIds
          .map((id: string) => materialTypes.find(type => type.id === id))
          .filter(Boolean)
          .concat(materialTypes.filter(type => !orderIds.includes(type.id)));
        setItems(orderedItems);
      } catch (error) {
        console.error('Failed to restore material type order:', error);
        setItems(materialTypes);
      }
    } else {
      setItems(materialTypes);
    }
  }, [materialTypes]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // 並び順をローカルストレージに保存
        localStorage.setItem('materialTypeOrder', JSON.stringify(newItems.map(item => item.id)));
        
        return newItems;
      });
    }
  }

  return (
    <div className="px-3 pt-3 pb-3 border-b border-gray-200">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={items.map(item => item.id)} 
          strategy={isMobile ? horizontalListSortingStrategy : horizontalListSortingStrategy}
        >
          {/* Mobile: Horizontal scrollable buttons */}
          {isMobile && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                variant={!selectedMaterialTypeId ? "default" : "outline"}
                size="sm"
                onClick={() => onMaterialTypeSelect(undefined)}
                className={`rounded-full shrink-0 ${!selectedMaterialTypeId ? "bg-gray-900 text-white" : "text-gray-600 border-gray-300 hover:bg-gray-50"}`}
              >
                すべて
              </Button>
              {items.map((type) => (
                <SortableButton
                  key={type.id}
                  type={type}
                  isSelected={selectedMaterialTypeId === type.id}
                  onSelect={() => onMaterialTypeSelect(type.id)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
          
          {/* Desktop: Flex wrap layout */}
          {!isMobile && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={!selectedMaterialTypeId ? "default" : "outline"}
                size="sm"
                onClick={() => onMaterialTypeSelect(undefined)}
                className={`rounded-full ${!selectedMaterialTypeId ? "bg-gray-900 text-white" : "text-gray-600 border-gray-300 hover:bg-gray-50"}`}
              >
                すべて
              </Button>
              {items.map((type) => (
                <SortableButton
                  key={type.id}
                  type={type}
                  isSelected={selectedMaterialTypeId === type.id}
                  onSelect={() => onMaterialTypeSelect(type.id)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>
    </div>
  );
}