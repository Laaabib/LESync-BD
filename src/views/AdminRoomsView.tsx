import React, { useState, useEffect, useMemo } from 'react';
import {
  BedDouble, Plus, Search, Filter, Trash2, Edit3, CheckCircle2,
  AlertCircle, Building, Layers, Sparkles, Key, Check, X, ShieldAlert,
  Tag, Users, DollarSign, Building2, Flame, Ban, CheckSquare,
  ChevronRight, ArrowUpDown, Info
} from 'lucide-react';
import { pmsService } from '../services/pmsService';
import { Room, RoomType, Floor } from '../types/pms';

export type AdminRoomsTab = 'rooms' | 'room-types' | 'floors';

interface AdminRoomsViewProps {
  initialTab?: AdminRoomsTab;
  onNavigate?: (route: string) => void;
}

const COMMON_AMENITIES = [
  'Wi-Fi',
  'Air Conditioned',
  'Smart TV 55"',
  'Mini Fridge',
  'Private Balcony',
  'King Bed',
  'Rain Shower',
  'Safety Deposit Locker',
  'Electric Kettle',
  'Tea/Coffee Setup',
  'Bathtub',
  'Jacuzzi Bath',
  'Lake View',
  'Garden View',
  'Workstation & Desk',
  'Complimentary Breakfast',
  'Butler Service',
  'Espresso Machine',
  'Bathrobes & Slippers',
  'Hair Dryer'
];

const BED_TYPES = [
  'King Bed',
  'Queen Bed',
  '2 Twin Beds',
  'Double Bed',
  'Super King Bed',
  'Canopy King Bed',
  '2 Queen Beds',
  'Single Bed',
  'Bunk Bed'
];

export const AdminRoomsView: React.FC<AdminRoomsViewProps> = ({
  initialTab = 'rooms',
  onNavigate
}) => {
  const [db, setDb] = useState(pmsService.getState());

  useEffect(() => {
    return pmsService.subscribe(setDb);
  }, []);

  const [activeTab, setActiveTab] = useState<AdminRoomsTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const canManageRooms = pmsService.hasPermission('can_manage_rooms');

  // Shared Notifications
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const triggerSuccess = (msg: string) => {
    setFormSuccess(msg);
    setFormError('');
    setTimeout(() => setFormSuccess(''), 3500);
  };

  // =========================================================================
  // TAB 1: PHYSICAL ROOMS STATE & HANDLERS
  // =========================================================================
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

  // Room Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [roomTypeId, setRoomTypeId] = useState(db.roomTypes[0]?.id || '');
  const [roomFloorNumber, setRoomFloorNumber] = useState<number>(1);
  const [roomBuilding, setRoomBuilding] = useState('Main Resort Complex');
  const [roomWing, setRoomWing] = useState('East Garden Wing');
  const [roomIsSmoking, setRoomIsSmoking] = useState(false);
  const [roomKeyCardCode, setRoomKeyCardCode] = useState('');
  const [roomFeaturesStr, setRoomFeaturesStr] = useState('Wi-Fi, Balcony, Smart TV, Mini Fridge, Air Conditioned');
  const [roomAmenitiesStr, setRoomAmenitiesStr] = useState('King Bed, Rain Shower, Safety Deposit Locker, Electric Kettle');

  // Floors sorted
  const sortedFloors = useMemo(() => {
    const list = Array.isArray(db.floors) && db.floors.length > 0 ? db.floors : pmsService.getFloors();
    return [...list].sort((a, b) => a.floorNumber - b.floorNumber);
  }, [db.floors]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return db.rooms.filter(room => {
      const matchSearch =
        room.roomNumber.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
        (room.roomTypeName || '').toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
        (room.wing || '').toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
        (room.building || '').toLowerCase().includes(roomSearchTerm.toLowerCase());
      const matchFloor = selectedFloorFilter === 'all' || String(room.floor) === selectedFloorFilter;
      const matchType = selectedTypeFilter === 'all' || room.roomTypeId === selectedTypeFilter;
      return matchSearch && matchFloor && matchType;
    });
  }, [db.rooms, roomSearchTerm, selectedFloorFilter, selectedTypeFilter]);

  const resetRoomForm = () => {
    setRoomNumber('');
    setRoomTypeId(db.roomTypes[0]?.id || '');
    const firstFloor = sortedFloors[0] || { floorNumber: 1, building: 'Main Resort Complex', wing: 'East Garden Wing' };
    setRoomFloorNumber(firstFloor.floorNumber);
    setRoomBuilding(firstFloor.building || 'Main Resort Complex');
    setRoomWing(firstFloor.wing || 'East Garden Wing');
    setRoomIsSmoking(false);
    setRoomKeyCardCode('');
    setRoomFeaturesStr('Wi-Fi, Balcony, Smart TV, Mini Fridge, Air Conditioned');
    setRoomAmenitiesStr('King Bed, Rain Shower, Safety Deposit Locker, Electric Kettle');
    setFormError('');
  };

  const handleOpenAddRoom = () => {
    resetRoomForm();
    setIsAddRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.roomNumber);
    setRoomTypeId(room.roomTypeId);
    setRoomFloorNumber(room.floor);
    setRoomBuilding(room.building || 'Main Resort Complex');
    setRoomWing(room.wing || 'East Garden Wing');
    setRoomIsSmoking(room.isSmoking || false);
    setRoomKeyCardCode(room.keyCardCode || `KC-${room.roomNumber}`);
    setRoomFeaturesStr(room.features?.join(', ') || '');
    setRoomAmenitiesStr(room.amenities?.join(', ') || '');
    setFormError('');
  };

  const handleFloorSelectionChange = (newFloorNum: number) => {
    setRoomFloorNumber(newFloorNum);
    const matchedFloor = sortedFloors.find(f => f.floorNumber === newFloorNum);
    if (matchedFloor) {
      if (matchedFloor.building) setRoomBuilding(matchedFloor.building);
      if (matchedFloor.wing) setRoomWing(matchedFloor.wing);
      if (matchedFloor.keyCardPrefix && roomNumber) {
        setRoomKeyCardCode(`${matchedFloor.keyCardPrefix}-${roomNumber}`);
      }
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!roomNumber.trim()) {
      setFormError('Room number is required.');
      return;
    }

    const features = (roomFeaturesStr || '').split(',').map(s => s.trim()).filter(Boolean);
    const amenities = (roomAmenitiesStr || '').split(',').map(s => s.trim()).filter(Boolean);

    try {
      pmsService.addRoom({
        roomNumber: roomNumber.trim(),
        roomTypeId,
        floor: Number(roomFloorNumber),
        building: roomBuilding,
        wing: roomWing,
        features,
        amenities,
        isSmoking: roomIsSmoking,
        keyCardCode: roomKeyCardCode.trim() || `KC-${roomNumber.trim()}`
      });

      setIsAddRoomModalOpen(false);
      triggerSuccess(`Physical Room ${roomNumber} added to inventory successfully!`);
      resetRoomForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create room.');
    }
  };

  const handleUpdateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    setFormError('');

    const features = (roomFeaturesStr || '').split(',').map(s => s.trim()).filter(Boolean);
    const amenities = (roomAmenitiesStr || '').split(',').map(s => s.trim()).filter(Boolean);

    try {
      pmsService.updateRoom(editingRoom.id, {
        roomNumber: roomNumber.trim(),
        roomTypeId,
        floor: Number(roomFloorNumber),
        building: roomBuilding,
        wing: roomWing,
        features,
        amenities,
        isSmoking: roomIsSmoking,
        keyCardCode: roomKeyCardCode.trim() || `KC-${roomNumber.trim()}`
      });

      setEditingRoom(null);
      triggerSuccess(`Room ${roomNumber} updated successfully!`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update room.');
    }
  };

  const handleDeleteRoom = () => {
    if (!deletingRoom) return;
    try {
      pmsService.deleteRoom(deletingRoom.id);
      triggerSuccess(`Room ${deletingRoom.roomNumber} removed from inventory.`);
      setDeletingRoom(null);
    } catch (err: any) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  // =========================================================================
  // TAB 2: ROOM TYPES & TARIFFS STATE & HANDLERS
  // =========================================================================
  const [typeSearchTerm, setTypeSearchTerm] = useState('');
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [deletingType, setDeletingType] = useState<RoomType | null>(null);

  // Room Type Form State
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [typeBaseRate, setTypeBaseRate] = useState<number>(6500);
  const [typeExtraAdultRate, setTypeExtraAdultRate] = useState<number>(1500);
  const [typeExtraChildRate, setTypeExtraChildRate] = useState<number>(800);
  const [typeMaxAdults, setTypeMaxAdults] = useState<number>(2);
  const [typeMaxChildren, setTypeMaxChildren] = useState<number>(1);
  const [typeBedType, setTypeBedType] = useState('King Bed');
  const [typeRoomSize, setTypeRoomSize] = useState('450 sq.ft / 42 sq.m');
  const [typeDescription, setTypeDescription] = useState('Elegantly appointed luxury room with scenic views and plush furnishings.');
  const [typeAmenities, setTypeAmenities] = useState<string[]>([
    'Wi-Fi', 'Air Conditioned', 'Smart TV 55"', 'Mini Fridge', 'Private Balcony', 'Rain Shower'
  ]);
  const [typeCustomAmenity, setTypeCustomAmenity] = useState('');
  const [typeActive, setTypeActive] = useState(true);

  const resetTypeForm = () => {
    setTypeName('');
    setTypeCode('');
    setTypeBaseRate(6500);
    setTypeExtraAdultRate(1500);
    setTypeExtraChildRate(800);
    setTypeMaxAdults(2);
    setTypeMaxChildren(1);
    setTypeBedType('King Bed');
    setTypeRoomSize('450 sq.ft / 42 sq.m');
    setTypeDescription('Elegantly appointed luxury room with scenic views and plush furnishings.');
    setTypeAmenities(['Wi-Fi', 'Air Conditioned', 'Smart TV 55"', 'Mini Fridge', 'Private Balcony', 'Rain Shower']);
    setTypeCustomAmenity('');
    setTypeActive(true);
    setFormError('');
  };

  const handleOpenAddType = () => {
    resetTypeForm();
    setIsAddTypeModalOpen(true);
  };

  const handleOpenEditType = (rt: RoomType) => {
    setEditingType(rt);
    setTypeName(rt.name);
    setTypeCode(rt.code || rt.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4));
    setTypeBaseRate(rt.baseRate);
    setTypeExtraAdultRate(rt.extraAdultRate || 1000);
    setTypeExtraChildRate(rt.extraChildRate || 500);
    setTypeMaxAdults(rt.maxAdults || 2);
    setTypeMaxChildren(rt.maxChildren || 1);
    setTypeBedType(rt.bedType || 'King Bed');
    setTypeRoomSize(rt.roomSize || '450 sq.ft');
    setTypeDescription(rt.description || '');
    setTypeAmenities(Array.isArray(rt.amenities) ? [...rt.amenities] : []);
    setTypeCustomAmenity('');
    setTypeActive(rt.active !== false);
    setFormError('');
  };

  const toggleTypeAmenity = (amenity: string) => {
    if (typeAmenities.includes(amenity)) {
      setTypeAmenities(typeAmenities.filter(a => a !== amenity));
    } else {
      setTypeAmenities([...typeAmenities, amenity]);
    }
  };

  const handleAddCustomAmenity = () => {
    if (typeCustomAmenity.trim() && !typeAmenities.includes(typeCustomAmenity.trim())) {
      setTypeAmenities([...typeAmenities, typeCustomAmenity.trim()]);
      setTypeCustomAmenity('');
    }
  };

  const handleCreateType = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!typeName.trim()) {
      setFormError('Room category name is required.');
      return;
    }
    if (typeBaseRate <= 0) {
      setFormError('Base rate must be greater than 0 BDT.');
      return;
    }

    try {
      const generatedCode = typeCode.trim() || typeName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);
      pmsService.addRoomType({
        name: typeName.trim(),
        code: generatedCode,
        baseRate: Number(typeBaseRate),
        basePrice: Number(typeBaseRate),
        extraAdultRate: Number(typeExtraAdultRate),
        extraChildRate: Number(typeExtraChildRate),
        maxAdults: Number(typeMaxAdults),
        maxChildren: Number(typeMaxChildren),
        bedType: typeBedType,
        roomSize: typeRoomSize.trim(),
        description: typeDescription.trim(),
        amenities: typeAmenities,
        active: typeActive
      });

      setIsAddTypeModalOpen(false);
      triggerSuccess(`Created new room category "${typeName.trim()}" successfully!`);
      resetTypeForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create room category.');
    }
  };

  const handleUpdateType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    setFormError('');
    if (!typeName.trim()) {
      setFormError('Room category name is required.');
      return;
    }

    try {
      const generatedCode = typeCode.trim() || typeName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);
      pmsService.updateRoomType(editingType.id, {
        name: typeName.trim(),
        code: generatedCode,
        baseRate: Number(typeBaseRate),
        basePrice: Number(typeBaseRate),
        extraAdultRate: Number(typeExtraAdultRate),
        extraChildRate: Number(typeExtraChildRate),
        maxAdults: Number(typeMaxAdults),
        maxChildren: Number(typeMaxChildren),
        bedType: typeBedType,
        roomSize: typeRoomSize.trim(),
        description: typeDescription.trim(),
        amenities: typeAmenities,
        active: typeActive
      });

      setEditingType(null);
      triggerSuccess(`Updated room category "${typeName.trim()}" successfully!`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update room category.');
    }
  };

  const handleDeleteType = () => {
    if (!deletingType) return;
    try {
      pmsService.deleteRoomType(deletingType.id);
      triggerSuccess(`Room category "${deletingType.name}" removed successfully.`);
      setDeletingType(null);
    } catch (err: any) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  // Filtered room types
  const filteredRoomTypes = useMemo(() => {
    return db.roomTypes.filter(rt => {
      const q = typeSearchTerm.toLowerCase();
      return (
        rt.name.toLowerCase().includes(q) ||
        (rt.code || '').toLowerCase().includes(q) ||
        (rt.bedType || '').toLowerCase().includes(q) ||
        (rt.description || '').toLowerCase().includes(q)
      );
    });
  }, [db.roomTypes, typeSearchTerm]);

  // =========================================================================
  // TAB 3: FLOORS & WINGS STATE & HANDLERS
  // =========================================================================
  const [floorSearchTerm, setFloorSearchTerm] = useState('');
  const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);

  // Floor Form State
  const [floorNum, setFloorNum] = useState<number>(5);
  const [floorName, setFloorName] = useState('');
  const [floorCode, setFloorCode] = useState('');
  const [floorBuilding, setFloorBuilding] = useState('Main Resort Complex');
  const [floorWing, setFloorWing] = useState('East Garden Wing');
  const [floorKeyCardPrefix, setFloorKeyCardPrefix] = useState('KC-5');
  const [floorSmokingAllowed, setFloorSmokingAllowed] = useState(false);
  const [floorDescription, setFloorDescription] = useState('Spacious resort rooms with scenic nature view and elevator connectivity');
  const [floorActive, setFloorActive] = useState(true);

  const resetFloorForm = () => {
    const existingFloors = sortedFloors.map(f => f.floorNumber);
    const nextFloorNumber = existingFloors.length > 0 ? Math.max(...existingFloors) + 1 : 1;
    setFloorNum(nextFloorNumber);
    setFloorName(`${nextFloorNumber === 0 ? 'Ground' : `${nextFloorNumber}${getOrdinalSuffix(nextFloorNumber)}`} Floor - Main Complex`);
    setFloorCode(`FL-${String(nextFloorNumber).padStart(2, '0')}`);
    setFloorBuilding('Main Resort Complex');
    setFloorWing('East Garden Wing');
    setFloorKeyCardPrefix(`KC-${nextFloorNumber}`);
    setFloorSmokingAllowed(false);
    setFloorDescription('Contemporary guest accommodation floor equipped with fire safety, high-speed Wi-Fi, and service pantry.');
    setFloorActive(true);
    setFormError('');
  };

  const handleOpenAddFloor = () => {
    resetFloorForm();
    setIsAddFloorModalOpen(true);
  };

  const handleOpenEditFloor = (fl: Floor) => {
    setEditingFloor(fl);
    setFloorNum(fl.floorNumber);
    setFloorName(fl.name);
    setFloorCode(fl.code || `FL-${String(fl.floorNumber).padStart(2, '0')}`);
    setFloorBuilding(fl.building || 'Main Resort Complex');
    setFloorWing(fl.wing || 'Main Wing');
    setFloorKeyCardPrefix(fl.keyCardPrefix || `KC-${fl.floorNumber}`);
    setFloorSmokingAllowed(fl.isSmokingAllowed || false);
    setFloorDescription(fl.description || '');
    setFloorActive(fl.active !== false);
    setFormError('');
  };

  const handleCreateFloor = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!floorName.trim()) {
      setFormError('Floor name is required.');
      return;
    }
    if (floorNum === undefined || floorNum === null || isNaN(Number(floorNum))) {
      setFormError('Valid floor number is required.');
      return;
    }

    try {
      pmsService.addFloor({
        floorNumber: Number(floorNum),
        name: floorName.trim(),
        code: floorCode.trim() || `FL-${String(floorNum).padStart(2, '0')}`,
        building: floorBuilding.trim() || 'Main Resort Complex',
        wing: floorWing.trim() || 'Main Wing',
        keyCardPrefix: floorKeyCardPrefix.trim() || `KC-${floorNum}`,
        isSmokingAllowed: floorSmokingAllowed,
        description: floorDescription.trim(),
        active: floorActive
      });

      setIsAddFloorModalOpen(false);
      triggerSuccess(`Created Floor ${floorNum} ("${floorName.trim()}") successfully!`);
      resetFloorForm();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create floor.');
    }
  };

  const handleUpdateFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor) return;
    setFormError('');
    if (!floorName.trim()) {
      setFormError('Floor name is required.');
      return;
    }

    try {
      pmsService.updateFloor(editingFloor.id, {
        floorNumber: Number(floorNum),
        name: floorName.trim(),
        code: floorCode.trim() || `FL-${String(floorNum).padStart(2, '0')}`,
        building: floorBuilding.trim() || 'Main Resort Complex',
        wing: floorWing.trim() || 'Main Wing',
        keyCardPrefix: floorKeyCardPrefix.trim() || `KC-${floorNum}`,
        isSmokingAllowed: floorSmokingAllowed,
        description: floorDescription.trim(),
        active: floorActive
      });

      setEditingFloor(null);
      triggerSuccess(`Updated floor "${floorName.trim()}" successfully!`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update floor.');
    }
  };

  const handleDeleteFloor = () => {
    if (!deletingFloor) return;
    try {
      pmsService.deleteFloor(deletingFloor.id);
      triggerSuccess(`Floor "${deletingFloor.name}" removed successfully.`);
      setDeletingFloor(null);
    } catch (err: any) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  // Filtered floors
  const filteredFloors = useMemo(() => {
    return sortedFloors.filter(fl => {
      const q = floorSearchTerm.toLowerCase();
      return (
        fl.name.toLowerCase().includes(q) ||
        String(fl.floorNumber).includes(q) ||
        (fl.code || '').toLowerCase().includes(q) ||
        (fl.wing || '').toLowerCase().includes(q) ||
        (fl.building || '').toLowerCase().includes(q)
      );
    });
  }, [sortedFloors, floorSearchTerm]);

  function getOrdinalSuffix(i: number) {
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  // Count active stats
  const totalPhysicalRooms = db.rooms.length;
  const totalConfiguredTypes = db.roomTypes.length;
  const totalConfiguredFloors = sortedFloors.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Room Inventory & Architecture Administration</h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] border border-indigo-500/30 font-semibold">
                  Admin Master
                </span>
              </div>
              <p className="text-sm text-slate-300">
                Setup room categories, floor plans, physical room inventory, keycard schemes, and nightly tariff structures.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'rooms' && (
            <button
              onClick={handleOpenAddRoom}
              disabled={!canManageRooms}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition ${
                canManageRooms
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Room</span>
            </button>
          )}

          {activeTab === 'room-types' && (
            <button
              onClick={handleOpenAddType}
              disabled={!canManageRooms}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition ${
                canManageRooms
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create Room Type</span>
            </button>
          )}

          {activeTab === 'floors' && (
            <button
              onClick={handleOpenAddFloor}
              disabled={!canManageRooms}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition ${
                canManageRooms
                  ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Floor</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Success Alert */}
      {formSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{formSuccess}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/80 p-1.5 rounded-2xl gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'rooms'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BedDouble className="w-4 h-4" />
          <span>Physical Rooms Directory</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'rooms' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
          }`}>
            {totalPhysicalRooms}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('room-types')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'room-types'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Room Types & Tariffs (Creation & Pricing)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'room-types' ? 'bg-cyan-700 text-cyan-100' : 'bg-slate-800 text-slate-400'
          }`}>
            {totalConfiguredTypes}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('floors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'floors'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Floors & Wings Setup (Floor Creation)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'floors' ? 'bg-purple-700 text-purple-100' : 'bg-slate-800 text-slate-400'
          }`}>
            {totalConfiguredFloors}
          </span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: PHYSICAL ROOMS DIRECTORY */}
      {/* ================================================================= */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[240px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by room number, type, floor, wing..."
                  value={roomSearchTerm}
                  onChange={e => setRoomSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                {/* Dynamic Floors Filter */}
                <select
                  value={selectedFloorFilter}
                  onChange={e => setSelectedFloorFilter(e.target.value)}
                  className="py-2 px-3 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Floors ({sortedFloors.length} Floors)</option>
                  {sortedFloors.map(fl => (
                    <option key={fl.id} value={String(fl.floorNumber)}>
                      Floor {fl.floorNumber} - {fl.name}
                    </option>
                  ))}
                </select>

                {/* Room Types Filter */}
                <select
                  value={selectedTypeFilter}
                  onChange={e => setSelectedTypeFilter(e.target.value)}
                  className="py-2 px-3 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Room Types ({db.roomTypes.length})</option>
                  {db.roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <span>Showing <strong className="text-slate-200">{filteredRooms.length}</strong> of {db.rooms.length} Rooms</span>
              <button
                onClick={handleOpenAddRoom}
                className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Room</span>
              </button>
            </div>
          </div>

          {/* Rooms Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Room #</th>
                    <th className="px-4 py-3.5">Room Type & Category</th>
                    <th className="px-4 py-3.5">Floor & Wing</th>
                    <th className="px-4 py-3.5">Base Rate</th>
                    <th className="px-4 py-3.5">Key Card Code</th>
                    <th className="px-4 py-3.5">Smoking</th>
                    <th className="px-4 py-3.5">Housekeeping</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <BedDouble className="w-8 h-8 text-slate-600" />
                          <p className="font-semibold text-slate-300">No rooms match the current search or filters.</p>
                          <p className="text-[11px] text-slate-500">Create a new room or reset the filter selections.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map(room => {
                      const roomType = db.roomTypes.find(rt => rt.id === room.roomTypeId);
                      const assignedFloor = sortedFloors.find(f => f.floorNumber === room.floor);
                      return (
                        <tr key={room.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-amber-400">
                            Room {room.roomNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-200">{room.roomTypeName || roomType?.name || 'Standard Room'}</div>
                            <div className="text-[10px] text-slate-400">{roomType?.bedType || 'King Bed'} • {roomType?.roomSize || 'Standard'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-300">
                              Floor {room.floor}
                              {assignedFloor?.name ? ` (${assignedFloor.name.split(' - ')[1] || assignedFloor.name})` : ''}
                            </span>
                            <div className="text-[10px] text-slate-500">{room.wing || 'Main Wing'} • {room.building || 'Main Complex'}</div>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-emerald-400">
                            ৳{(roomType?.baseRate || 5000).toLocaleString()}/nt
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                              {room.keyCardCode || `KC-${room.roomNumber}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {room.isSmoking ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 w-fit">
                                <Flame className="w-2.5 h-2.5" />
                                Smoking
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20 flex items-center gap-1 w-fit">
                                <Ban className="w-2.5 h-2.5" />
                                Non-Smoking
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              room.housekeepingStatus === 'Clean' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              room.housekeepingStatus === 'Dirty' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              room.housekeepingStatus === 'Inspected' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {room.housekeepingStatus || 'Clean'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              room.operationalStatus === 'Available' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              room.operationalStatus === 'Occupied' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              room.operationalStatus === 'Reserved' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {room.operationalStatus || 'Available'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => handleOpenEditRoom(room)}
                                disabled={!canManageRooms}
                                title="Edit Room Specifications"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingRoom(room)}
                                disabled={!canManageRooms}
                                title="Delete Room"
                                className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 rounded border border-slate-700 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: ROOM TYPES & TARIFFS */}
      {/* ================================================================= */}
      {activeTab === 'room-types' && (
        <div className="space-y-4">
          {/* Header Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search room categories, codes, bed types..."
                  value={typeSearchTerm}
                  onChange={e => setTypeSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Total Categories: <strong className="text-cyan-400">{filteredRoomTypes.length}</strong>
              </span>
              <button
                onClick={handleOpenAddType}
                disabled={!canManageRooms}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Room Type</span>
              </button>
            </div>
          </div>

          {/* Cards Grid of Room Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoomTypes.map(rt => {
              const assignedRoomsCount = db.rooms.filter(r => r.roomTypeId === rt.id).length;
              return (
                <div
                  key={rt.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-100">{rt.name}</h3>
                          {rt.code && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/30">
                              {rt.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{rt.bedType || 'King Bed'}</span>
                          <span>•</span>
                          <span>{rt.roomSize || 'Standard Dimensions'}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        rt.active !== false
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {rt.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {rt.description || 'No description provided.'}
                    </p>

                    {/* Rates Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400">Base Tariff</div>
                        <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">
                          ৳{rt.baseRate.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Extra Adult</div>
                        <div className="font-mono font-semibold text-slate-200 text-xs mt-0.5">
                          ৳{(rt.extraAdultRate || 1000).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Extra Child</div>
                        <div className="font-mono font-semibold text-slate-200 text-xs mt-0.5">
                          ৳{(rt.extraChildRate || 500).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Occupancy Limits */}
                    <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Max Capacity: <strong>{rt.maxAdults} Adults</strong>, <strong>{rt.maxChildren} Child</strong></span>
                      </div>
                      <span className="text-amber-400 font-mono text-[10px] font-bold">
                        {assignedRoomsCount} Rooms
                      </span>
                    </div>

                    {/* Amenities pills */}
                    {Array.isArray(rt.amenities) && rt.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {rt.amenities.slice(0, 4).map((am, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700"
                          >
                            {am}
                          </span>
                        ))}
                        {rt.amenities.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500 text-[10px]">
                            +{rt.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500">ID: {rt.id}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditType(rt)}
                        disabled={!canManageRooms}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-cyan-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingType(rt)}
                        disabled={!canManageRooms || assignedRoomsCount > 0}
                        title={assignedRoomsCount > 0 ? 'Cannot delete category with assigned physical rooms' : 'Delete category'}
                        className={`p-1.5 rounded-lg border transition ${
                          assignedRoomsCount > 0
                            ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border-slate-700 cursor-pointer'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: FLOORS & WINGS SETUP */}
      {/* ================================================================= */}
      {activeTab === 'floors' && (
        <div className="space-y-4">
          {/* Header Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search floors by number, name, building, wing..."
                  value={floorSearchTerm}
                  onChange={e => setFloorSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Total Floors: <strong className="text-purple-400">{filteredFloors.length}</strong>
              </span>
              <button
                onClick={handleOpenAddFloor}
                disabled={!canManageRooms}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Floor</span>
              </button>
            </div>
          </div>

          {/* Floors Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFloors.map(fl => {
              const roomsOnThisFloor = db.rooms.filter(r => r.floor === fl.floorNumber);
              return (
                <div
                  key={fl.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 font-mono font-bold text-base flex items-center justify-center border border-purple-500/30">
                          #{fl.floorNumber}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-100">{fl.name}</h3>
                          <div className="text-[11px] text-slate-400">
                            {fl.building || 'Main Complex'} • {fl.wing || 'Main Wing'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          fl.active !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {fl.active !== false ? 'Active' : 'Inactive'}
                        </span>
                        {fl.code && (
                          <span className="text-[10px] font-mono text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-500/20">
                            {fl.code}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {fl.description || 'Standard floor layout with guest rooms and service elevators.'}
                    </p>

                    {/* Floor Specifications */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Keycard Prefix</span>
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {fl.keyCardPrefix || `KC-${fl.floorNumber}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Smoking Policy</span>
                        <span className={`text-[10px] font-semibold ${
                          fl.isSmokingAllowed ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {fl.isSmokingAllowed ? '🚬 Allowed' : '🚭 100% Non-Smoking'}
                        </span>
                      </div>
                    </div>

                    {/* Room Roster on Floor */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Assigned Physical Rooms:</span>
                        <strong className="text-slate-200">{roomsOnThisFloor.length} Rooms</strong>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                        {roomsOnThisFloor.length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic">No rooms mapped to floor {fl.floorNumber} yet.</span>
                        ) : (
                          roomsOnThisFloor.map(r => (
                            <span
                              key={r.id}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px] border border-slate-700"
                            >
                              Rm {r.roomNumber}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500">Floor ID: {fl.id}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditFloor(fl)}
                        disabled={!canManageRooms}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-purple-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingFloor(fl)}
                        disabled={!canManageRooms || roomsOnThisFloor.length > 0}
                        title={roomsOnThisFloor.length > 0 ? `Cannot delete floor: ${roomsOnThisFloor.length} rooms are assigned here` : 'Delete floor'}
                        className={`p-1.5 rounded-lg border transition ${
                          roomsOnThisFloor.length > 0
                            ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border-slate-700 cursor-pointer'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 1: ADD PHYSICAL ROOM */}
      {/* ================================================================= */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                  <BedDouble className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Add New Room to Inventory</h2>
                  <p className="text-[11px] text-slate-400">Configure room number, category, floor mapping, and amenities</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddRoomModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Room Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101, 205, 312"
                    value={roomNumber}
                    onChange={e => {
                      setRoomNumber(e.target.value);
                      if (!roomKeyCardCode) {
                        setRoomKeyCardCode(`KC-${e.target.value}`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">Room Type</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddRoomModalOpen(false);
                        handleOpenAddType();
                      }}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      + New Type
                    </button>
                  </div>
                  <select
                    value={roomTypeId}
                    onChange={e => setRoomTypeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {db.roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} (৳{rt.baseRate.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Floor Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-semibold">Floor</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddRoomModalOpen(false);
                        handleOpenAddFloor();
                      }}
                      className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                    >
                      + New Floor
                    </button>
                  </div>
                  <select
                    value={roomFloorNumber}
                    onChange={e => handleFloorSelectionChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {sortedFloors.map(fl => (
                      <option key={fl.id} value={fl.floorNumber}>
                        Floor #{fl.floorNumber} - {fl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Keycard Access Code</label>
                  <input
                    type="text"
                    placeholder="e.g. KC-101"
                    value={roomKeyCardCode}
                    onChange={e => setRoomKeyCardCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Building Complex</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Resort Complex"
                    value={roomBuilding}
                    onChange={e => setRoomBuilding(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Wing / Section</label>
                  <input
                    type="text"
                    placeholder="e.g. East Garden Wing"
                    value={roomWing}
                    onChange={e => setRoomWing(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Room Features (comma separated)</label>
                <input
                  type="text"
                  value={roomFeaturesStr}
                  onChange={e => setRoomFeaturesStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Room Amenities (comma separated)</label>
                <input
                  type="text"
                  value={roomAmenitiesStr}
                  onChange={e => setRoomAmenitiesStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="roomSmoking"
                  checked={roomIsSmoking}
                  onChange={e => setRoomIsSmoking(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="roomSmoking" className="text-slate-300 font-medium cursor-pointer">
                  Smoking Permitted in this Room
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRoomModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer transition shadow-sm"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: EDIT PHYSICAL ROOM */}
      {/* ================================================================= */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Edit Room #{editingRoom.roomNumber}</h2>
                  <p className="text-[11px] text-slate-400">Modify physical specifications, category and keycard details</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRoom} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room Type</label>
                  <select
                    value={roomTypeId}
                    onChange={e => setRoomTypeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {db.roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name} (৳{rt.baseRate.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Floor</label>
                  <select
                    value={roomFloorNumber}
                    onChange={e => handleFloorSelectionChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {sortedFloors.map(fl => (
                      <option key={fl.id} value={fl.floorNumber}>
                        Floor #{fl.floorNumber} - {fl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Keycard Access Code</label>
                  <input
                    type="text"
                    value={roomKeyCardCode}
                    onChange={e => setRoomKeyCardCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Building</label>
                  <input
                    type="text"
                    value={roomBuilding}
                    onChange={e => setRoomBuilding(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Wing</label>
                  <input
                    type="text"
                    value={roomWing}
                    onChange={e => setRoomWing(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Features (comma separated)</label>
                <input
                  type="text"
                  value={roomFeaturesStr}
                  onChange={e => setRoomFeaturesStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amenities (comma separated)</label>
                <input
                  type="text"
                  value={roomAmenitiesStr}
                  onChange={e => setRoomAmenitiesStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editRoomSmoking"
                  checked={roomIsSmoking}
                  onChange={e => setRoomIsSmoking(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 bg-slate-800 border-slate-700 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="editRoomSmoking" className="text-slate-300 font-medium cursor-pointer">
                  Smoking Permitted in this Room
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold cursor-pointer transition shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: CREATE ROOM TYPE / CATEGORY */}
      {/* ================================================================= */}
      {(isAddTypeModalOpen || editingType) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingType ? `Edit Room Category: ${editingType.name}` : 'Create New Room Category & Tariff'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Define category name, short code, base rate, extra person pricing, capacity, and luxury amenities
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddTypeModalOpen(false);
                  setEditingType(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingType ? handleUpdateType : handleCreateType}
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Room Category Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Executive Pool Suite, Deluxe Double Room"
                    value={typeName}
                    onChange={e => {
                      setTypeName(e.target.value);
                      if (!typeCode && !editingType) {
                        const words = e.target.value.split(' ').filter(Boolean);
                        if (words.length > 0) {
                          setTypeCode(words.map(w => w[0]).join('').toUpperCase().slice(0, 4));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Short Code</label>
                  <input
                    type="text"
                    placeholder="e.g. EPS, DDR"
                    value={typeCode}
                    onChange={e => setTypeCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Tariff Pricing */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <div className="font-semibold text-cyan-400 text-xs flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Nightly Tariff & Additional Guest Surcharges (BDT ৳)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Base Rate / Night (৳) *</label>
                    <input
                      type="number"
                      required
                      min={100}
                      step={100}
                      value={typeBaseRate}
                      onChange={e => setTypeBaseRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Extra Adult Charge (৳)</label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={typeExtraAdultRate}
                      onChange={e => setTypeExtraAdultRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Extra Child Charge (৳)</label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={typeExtraChildRate}
                      onChange={e => setTypeExtraChildRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Capacity & Configuration */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Adults</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={typeMaxAdults}
                    onChange={e => setTypeMaxAdults(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Children</label>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={typeMaxChildren}
                    onChange={e => setTypeMaxChildren(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bed Configuration</label>
                  <select
                    value={typeBedType}
                    onChange={e => setTypeBedType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    {BED_TYPES.map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 520 sq.ft / 48 sq.m"
                    value={typeRoomSize}
                    onChange={e => setTypeRoomSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category Marketing Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe view, ambiance, special features, and furnishings..."
                  value={typeDescription}
                  onChange={e => setTypeDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Amenities Picker */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">Standard Amenities Checklist</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-slate-800/40 border border-slate-800 rounded-xl">
                  {COMMON_AMENITIES.map(am => {
                    const isSelected = typeAmenities.includes(am);
                    return (
                      <button
                        key={am}
                        type="button"
                        onClick={() => toggleTypeAmenity(am)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-500" />}
                        <span>{am}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Type custom amenity and click Add..."
                    value={typeCustomAmenity}
                    onChange={e => setTypeCustomAmenity(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAmenity();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    + Add Amenity
                  </button>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="typeActiveCheck"
                  checked={typeActive}
                  onChange={e => setTypeActive(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-0 bg-slate-800 border-slate-700 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="typeActiveCheck" className="text-slate-300 font-medium cursor-pointer">
                  Category is Active and Bookable in Front Desk & Online Reservation
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddTypeModalOpen(false);
                    setEditingType(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold cursor-pointer transition shadow-sm"
                >
                  {editingType ? 'Save Category Changes' : 'Create Room Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: CREATE / EDIT FLOOR */}
      {/* ================================================================= */}
      {(isAddFloorModalOpen || editingFloor) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    {editingFloor ? `Edit Floor: ${editingFloor.name}` : 'Create New Floor & Wing Mapping'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Define floor number, title, building wing, keycard prefix, and room capacity
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddFloorModalOpen(false);
                  setEditingFloor(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingFloor ? handleUpdateFloor : handleCreateFloor}
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Floor Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={99}
                    placeholder="0, 1, 2, 3..."
                    value={floorNum}
                    onChange={e => {
                      const num = Number(e.target.value);
                      setFloorNum(num);
                      if (!floorCode) setFloorCode(`FL-${String(num).padStart(2, '0')}`);
                      if (!floorKeyCardPrefix) setFloorKeyCardPrefix(`KC-${num}`);
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Use 0 for Ground Floor</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Floor Name / Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1st Floor - East Garden Wing"
                    value={floorName}
                    onChange={e => setFloorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Floor Code</label>
                  <input
                    type="text"
                    placeholder="e.g. FL-01, GND, EXEC-3"
                    value={floorCode}
                    onChange={e => setFloorCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Keycard Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. KC-1, KC-2"
                    value={floorKeyCardPrefix}
                    onChange={e => setFloorKeyCardPrefix(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Building Complex</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Resort Complex, Convention Tower"
                    value={floorBuilding}
                    onChange={e => setFloorBuilding(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Wing / Section</label>
                  <input
                    type="text"
                    placeholder="e.g. East Garden Wing, West Lake Wing"
                    value={floorWing}
                    onChange={e => setFloorWing(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Floor Description & Notes</label>
                <textarea
                  rows={2}
                  placeholder="Specify elevators, pantry location, scenic orientations..."
                  value={floorDescription}
                  onChange={e => setFloorDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="floorSmokingCheck"
                    checked={floorSmokingAllowed}
                    onChange={e => setFloorSmokingAllowed(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-0 bg-slate-800 border-slate-700 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="floorSmokingCheck" className="text-slate-300 font-medium cursor-pointer">
                    Smoking Permitted on this Floor
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="floorActiveCheck"
                    checked={floorActive}
                    onChange={e => setFloorActive(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-0 bg-slate-800 border-slate-700 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="floorActiveCheck" className="text-slate-300 font-medium cursor-pointer">
                    Floor is Active and Operational
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddFloorModalOpen(false);
                    setEditingFloor(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold cursor-pointer transition shadow-sm"
                >
                  {editingFloor ? 'Save Floor Changes' : 'Create Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* DELETE CONFIRMATION MODALS */}
      {/* ================================================================= */}
      {deletingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Room {deletingRoom.roomNumber}?</h3>
                <p className="text-xs text-slate-400">This will remove this physical room from the active inventory.</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete Room <strong>{deletingRoom.roomNumber}</strong> ({deletingRoom.roomTypeName})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingRoom(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm"
              >
                Delete Room
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingType && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Room Category?</h3>
                <p className="text-xs text-slate-400">Remove category definition and tariff specifications</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete category <strong>{deletingType.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingType(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteType}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingFloor && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Floor #{deletingFloor.floorNumber}?</h3>
                <p className="text-xs text-slate-400">Remove floor plan definition from resort architecture</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete <strong>{deletingFloor.name}</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingFloor(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFloor}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-sm"
              >
                Delete Floor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
