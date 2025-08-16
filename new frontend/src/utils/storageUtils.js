/**
 * Storage utilities for managing localStorage with selective clearing
 * Preserves avatar data during authentication state changes
 */

// Keys that should be preserved during logout
const PERSISTENT_KEYS = [
  "gurukul_favorite_avatars",
  "gurukul_last_selected_avatar",
  "gurukul_avatar_global_state",
  "gurukul_custom_models", // Custom uploaded .glb models
  "gurukul_settings", // Keep user settings too
  "gurukul_chat_history", // Chat history storage
  "gurukul_chat_sessions", // Chat sessions storage
  "gurukul_chat_settings", // Chat settings
  "selectedAIModel", // Selected AI model preference
];

// Keys that should be cleared during logout (auth-related)
const AUTH_KEYS = ["supabase.auth.token", "sb-auth-token", "lastVisitedPath"];

/**
 * Safe localStorage operations with error handling
 */
export const storage = {
  /**
   * Get item from localStorage with error handling
   */
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },

  /**
   * Set item in localStorage with error handling
   */
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Remove item from localStorage with error handling
   */
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Clear all localStorage except persistent keys
   */
  clearExceptPersistent: () => {
    try {
      // Get all persistent data before clearing
      const persistentData = {};
      PERSISTENT_KEYS.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          persistentData[key] = value;
        }
      });

      // Clear all localStorage
      localStorage.clear();

      // Restore persistent data
      Object.entries(persistentData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      console.log(
        "localStorage cleared except persistent keys:",
        PERSISTENT_KEYS
      );
      return true;
    } catch (error) {
      console.error("Error clearing localStorage selectively:", error);
      return false;
    }
  },

  /**
   * Clear only authentication-related keys
   */
  clearAuthKeys: () => {
    try {
      AUTH_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Clear any keys that start with 'sb-' (Supabase auth tokens)
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-")) {
          localStorage.removeItem(key);
        }
      });

      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("sb-")) {
          sessionStorage.removeItem(key);
        }
      });

      console.log("Authentication keys cleared");
      return true;
    } catch (error) {
      console.error("Error clearing auth keys:", error);
      return false;
    }
  },

  /**
   * Get all avatar-related data
   */
  getAvatarData: () => {
    try {
      const favorites = storage.getItem("gurukul_favorite_avatars");
      const lastSelected = storage.getItem("gurukul_last_selected_avatar");
      const globalState = storage.getItem("gurukul_avatar_global_state");

      return {
        favorites: favorites ? JSON.parse(favorites) : null,
        lastSelectedId: lastSelected,
        globalState: globalState ? JSON.parse(globalState) : null,
      };
    } catch (error) {
      console.error("Error getting avatar data:", error);
      return {
        favorites: null,
        lastSelectedId: null,
        globalState: null,
      };
    }
  },

  /**
   * Save avatar global state (pin mode, settings tab, etc.)
   * Note: Explicitly excludes chat history to prevent duplication issues
   */
  saveAvatarGlobalState: (state) => {
    try {
      const globalState = {
        isPinModeEnabled: state.isPinModeEnabled,
        pinnedAvatarPosition: state.pinnedAvatarPosition,
        activeSettingsTab: state.activeSettingsTab,
        activeMainTab: state.activeMainTab,
        gridPosition: state.gridPosition,
        gridRotation: state.gridRotation,
        gridScale: state.gridScale,
        pinPosition: state.pinPosition,
        pinRotation: state.pinRotation,
        pinScale: state.pinScale,
        lastUpdated: new Date().toISOString(),
        // Explicitly exclude chat-related data to prevent duplication
        // chatHistory: intentionally omitted
        // isChatOpen: intentionally omitted (should not persist)
      };

      return storage.setItem(
        "gurukul_avatar_global_state",
        JSON.stringify(globalState)
      );
    } catch (error) {
      console.error("Error saving avatar global state:", error);
      return false;
    }
  },

  /**
   * Save custom models to localStorage
   */
  saveCustomModels: (models) => {
    try {
      return storage.setItem("gurukul_custom_models", JSON.stringify(models));
    } catch (error) {
      console.error("Error saving custom models:", error);
      return false;
    }
  },

  /**
   * Load custom models from localStorage
   */
  loadCustomModels: () => {
    try {
      const models = storage.getItem("gurukul_custom_models");
      return models ? JSON.parse(models) : [];
    } catch (error) {
      console.error("Error loading custom models:", error);
      return [];
    }
  },

  /**
   * Save .glb file data to localStorage (Base64 encoded)
   */
  saveGlbFile: (fileId, fileData, metadata) => {
    try {
      const fileKey = `gurukul_glb_${fileId}`;
      const fileInfo = {
        data: fileData, // Base64 encoded file data
        metadata: metadata,
        savedAt: new Date().toISOString(),
      };
      return storage.setItem(fileKey, JSON.stringify(fileInfo));
    } catch (error) {
      console.error("Error saving GLB file:", error);
      return false;
    }
  },

  /**
   * Load .glb file data from localStorage
   */
  loadGlbFile: (fileId) => {
    try {
      const fileKey = `gurukul_glb_${fileId}`;
      const fileInfo = storage.getItem(fileKey);
      return fileInfo ? JSON.parse(fileInfo) : null;
    } catch (error) {
      console.error("Error loading GLB file:", error);
      return null;
    }
  },

  /**
   * Delete .glb file from localStorage
   */
  deleteGlbFile: (fileId) => {
    try {
      const fileKey = `gurukul_glb_${fileId}`;
      storage.removeItem(fileKey);
      return true;
    } catch (error) {
      console.error("Error deleting GLB file:", error);
      return false;
    }
  },

  /**
   * Get storage usage information
   */
  getStorageInfo: () => {
    try {
      let totalSize = 0;
      let customModelsSize = 0;

      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const size = localStorage[key].length;
          totalSize += size;

          if (
            key.startsWith("gurukul_glb_") ||
            key === "gurukul_custom_models"
          ) {
            customModelsSize += size;
          }
        }
      }

      // Convert to MB (approximate)
      return {
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        customModelsSizeMB: (customModelsSize / 1024 / 1024).toFixed(2),
        totalItems: Object.keys(localStorage).length,
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return {
        totalSizeMB: "0",
        customModelsSizeMB: "0",
        totalItems: 0,
      };
    }
  },

  /**
   * Test avatar persistence functionality
   * Call this in browser console: storage.testAvatarPersistence()
   */
  testAvatarPersistence: () => {
    console.log("🧪 Testing Avatar Persistence...");

    // Create test data
    const testAvatar = {
      id: "test-persistence-" + Date.now(),
      name: "Test Avatar",
      previewUrl: "/avatar/jupiter.glb",
      timestamp: new Date().toISOString(),
      pinPosition: { x: 1, y: 2, z: 3 },
      pinScale: 0.8,
    };

    // Save test data
    const favorites = [testAvatar];
    storage.setItem("gurukul_favorite_avatars", JSON.stringify(favorites));
    storage.setItem("gurukul_last_selected_avatar", testAvatar.id);

    console.log("✅ Test avatar saved");

    // Simulate logout
    storage.clearExceptPersistent();

    // Check if data persisted
    const persistedFavorites = JSON.parse(
      storage.getItem("gurukul_favorite_avatars") || "[]"
    );
    const persistedLastSelected = storage.getItem(
      "gurukul_last_selected_avatar"
    );

    const success =
      persistedFavorites.length > 0 && persistedLastSelected === testAvatar.id;

    if (success) {
      console.log("🎉 SUCCESS: Avatar data persisted through logout!");
    } else {
      console.log("❌ FAILURE: Avatar data was lost during logout");
    }

    return success;
  },

  /**
   * Test image avatar persistence specifically
   * Call this in browser console: storage.testImageAvatarPersistence()
   */
  testImageAvatarPersistence: () => {
    console.log("🧪 Testing Image Avatar Persistence...");

    // Create test image avatar data (simulating uploaded image)
    const testImageAvatar = {
      id: "fav_test-image-" + Date.now(),
      originalId: "test-image-" + Date.now(),
      name: "Test Image Avatar",
      mediaType: "image",
      previewUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      fileData:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      timestamp: new Date().toISOString(),
      isCustomModel: true,
      activeTab: "custom-models",
      pinPosition: { x: 0, y: 0, z: 0 },
      pinRotation: { x: 0, y: 0, z: 0 },
      pinScale: 1,
    };

    // Save test data
    const favorites = [testImageAvatar];
    storage.setItem("gurukul_favorite_avatars", JSON.stringify(favorites));
    storage.setItem("gurukul_last_selected_avatar", testImageAvatar.id);

    console.log("✅ Test image avatar saved");

    // Simulate logout
    storage.clearExceptPersistent();

    // Check if data persisted
    const persistedFavorites = JSON.parse(
      storage.getItem("gurukul_favorite_avatars") || "[]"
    );
    const persistedLastSelected = storage.getItem(
      "gurukul_last_selected_avatar"
    );

    const success =
      persistedFavorites.length > 0 &&
      persistedLastSelected === testImageAvatar.id &&
      persistedFavorites[0].mediaType === "image" &&
      persistedFavorites[0].isCustomModel === true;

    if (success) {
      console.log("🎉 SUCCESS: Image avatar data persisted through logout!");
      console.log("✅ Image avatar found in favorites");
      console.log("✅ Last selected image avatar ID preserved");
      console.log("✅ Image avatar metadata preserved");
    } else {
      console.log("❌ FAILURE: Image avatar data was lost during logout");
      console.log("Persisted favorites:", persistedFavorites);
      console.log("Persisted last selected:", persistedLastSelected);
    }

    return success;
  },

  /**
   * Debug current avatar storage state
   * Call this in browser console: storage.debugAvatarStorage()
   */
  debugAvatarStorage: () => {
    console.log("🔍 Debugging Avatar Storage State...");
    console.log("=====================================");

    // Check what's currently in localStorage
    const favorites = storage.getItem("gurukul_favorite_avatars");
    const lastSelected = storage.getItem("gurukul_last_selected_avatar");
    const globalState = storage.getItem("gurukul_avatar_global_state");

    console.log("📦 Raw localStorage data:");
    console.log("- gurukul_favorite_avatars:", favorites);
    console.log("- gurukul_last_selected_avatar:", lastSelected);
    console.log("- gurukul_avatar_global_state:", globalState);

    // Parse and analyze favorites
    try {
      const parsedFavorites = favorites ? JSON.parse(favorites) : [];
      console.log(
        "\n🎭 Parsed Favorites (" + parsedFavorites.length + " items):"
      );
      parsedFavorites.forEach((fav, index) => {
        console.log(`${index + 1}. ID: ${fav.id}`);
        console.log(`   Name: ${fav.name}`);
        console.log(`   Type: ${fav.mediaType || "default"}`);
        console.log(`   IsCustomModel: ${fav.isCustomModel || false}`);
        console.log(`   PreviewUrl: ${fav.previewUrl?.substring(0, 50)}...`);
        console.log(`   OriginalId: ${fav.originalId || "N/A"}`);
        console.log("   ---");
      });

      // Check if last selected ID exists in favorites
      if (lastSelected) {
        const matchingFavorite = parsedFavorites.find(
          (fav) => fav.id === lastSelected
        );
        console.log(`\n🎯 Last Selected Avatar Analysis:`);
        console.log(`- Last Selected ID: ${lastSelected}`);
        console.log(`- Found in favorites: ${matchingFavorite ? "YES" : "NO"}`);
        if (matchingFavorite) {
          console.log(
            `- Matching favorite: ${matchingFavorite.name} (${
              matchingFavorite.mediaType || "default"
            })`
          );
        } else {
          console.log(
            `- Available IDs in favorites:`,
            parsedFavorites.map((f) => f.id)
          );
        }
      }
    } catch (error) {
      console.error("❌ Error parsing favorites:", error);
    }

    // Check Redux state if available
    if (window.store) {
      const reduxState = window.store.getState();
      console.log("\n🔄 Redux State:");
      console.log(
        "- Selected Avatar:",
        reduxState.avatar?.selectedAvatar?.name || "None"
      );
      console.log(
        "- Favorites Count:",
        reduxState.avatar?.favorites?.length || 0
      );
    }

    console.log("\n✅ Debug complete. Check the data above for issues.");
  },

  /**
   * Simple test for avatar persistence
   * Run this after selecting an image: storage.testCurrentState()
   */
  testCurrentState: () => {
    console.log("🧪🧪🧪 AVATAR PERSISTENCE TEST 🧪🧪🧪");
    console.log("==========================================");

    // Check Redux state if available
    if (window.store) {
      const state = window.store.getState();
      const selectedAvatar = state.avatar?.selectedAvatar;
      const favorites = state.avatar?.favorites || [];

      console.log("🎭 Selected Avatar:", selectedAvatar?.name || "None");
      console.log("🆔 Selected Avatar ID:", selectedAvatar?.id || "None");
      console.log(
        "🖼️ Is Custom Image:",
        selectedAvatar?.isCustomModel && selectedAvatar?.mediaType === "image"
      );
      console.log("📁 Has File Data:", !!selectedAvatar?.fileData);
      console.log("⭐ Favorites Count:", favorites.length);

      // Check localStorage
      const lastSelectedId = localStorage.getItem(
        "gurukul_last_selected_avatar"
      );
      console.log("💾 Saved Last Selected ID:", lastSelectedId);
      console.log("🔗 IDs Match:", selectedAvatar?.id === lastSelectedId);

      if (selectedAvatar?.id !== lastSelectedId) {
        console.warn(
          "⚠️⚠️⚠️ ID MISMATCH - This will cause restoration to fail!"
        );
        console.warn("Current ID:", selectedAvatar?.id);
        console.warn("Saved ID:", lastSelectedId);
      } else {
        console.log("✅✅✅ IDs MATCH - Restoration should work!");
      }

      console.log("==========================================");
      console.log("🧪 Test complete - check results above 🧪");
    } else {
      console.log("❌ Redux store not available");
    }
  },
};

export default storage;
